-- Unidades de medida por producto con lógica de conversión.
-- No modifica nombre, categoría, presentaciones ni precios de la carta pública.
-- Solo agrega columnas nuevas a item y las calcula a partir de unidad_medida.factor_base.

alter table item
  add column if not exists id_unidad_compra integer references unidad_medida(id_unidad),
  add column if not exists id_unidad_venta  integer references unidad_medida(id_unidad),
  add column if not exists factor_compra    numeric(14,6),
  add column if not exists factor_venta     numeric(14,6);

comment on column item.id_unidad_base is 'Unidad base del producto; todas las conversiones se hacen contra ella.';
comment on column item.id_unidad_compra is 'Unidad en la que se compra el producto (combobox en el panel).';
comment on column item.id_unidad_venta is 'Unidad en la que se serve/vende el producto (combobox en el panel).';
comment on column item.factor_compra is 'Cantidad de unidades base que equivale 1 unidad de compra. Calculado automáticamente.';
comment on column item.factor_venta is 'Cantidad de unidades base que equivale 1 unidad de venta. Calculado automáticamente.';

-- Valores iniciales: compra y venta parten de la unidad base y se calculan abajo.
update item
   set id_unidad_compra = coalesce(id_unidad_compra, id_unidad_base),
       id_unidad_venta  = coalesce(id_unidad_venta, id_unidad_base)
 where id_unidad_compra is null or id_unidad_venta is null;

-- Si el producto ya tiene presentaciones de compra/venta, se aprovechan.
with u as (
  select ip.id_item,
         max(case when ip.es_compra then ip.id_unidad end) as compra,
         max(case when ip.es_venta then ip.id_unidad end) as venta
  from item_presentacion ip
  group by ip.id_item
)
update item i
   set id_unidad_compra = coalesce(u.compra, i.id_unidad_compra),
       id_unidad_venta  = coalesce(u.venta, i.id_unidad_venta)
  from u
 where u.id_item = i.id_item;

-- Criterio de negocio para los productos actuales de la carta (solo columnas nuevas):
--   cortes -> se compran en kg y se sirven por unidad
--   platos -> se compran en caja y se sirven por unidad
--   bebidas -> se compran en litros y se sirven por unidad
update item
   set id_unidad_compra = case when id_item <= 3 then 2 when id_item = 8 then 3 else 4 end,
       id_unidad_venta  = 1
 where id_item between 1 and 8;

-- factor = factor_base(unidad) / factor_base(unidad_base)  (unidad base = und => 1).
create or replace function fn_item_calcular_factores()
returns trigger
language plpgsql
as $$
declare
  v_base  numeric;
  v_compra numeric;
  v_venta  numeric;
begin
  new.id_unidad_compra := coalesce(new.id_unidad_compra, new.id_unidad_base);
  new.id_unidad_venta  := coalesce(new.id_unidad_venta, new.id_unidad_base);

  select factor_base into v_base  from unidad_medida where id_unidad = new.id_unidad_base;
  select factor_base into v_compra from unidad_medida where id_unidad = new.id_unidad_compra;
  select factor_base into v_venta  from unidad_medida where id_unidad = new.id_unidad_venta;

  if v_base is null or v_base <= 0 then
    raise exception 'El producto necesita una unidad base válida';
  end if;
  if v_compra is null or v_venta is null then
    raise exception 'Las unidades de compra y venta deben existir en unidad_medida';
  end if;

  new.factor_compra := round(v_compra / v_base, 6);
  new.factor_venta  := round(v_venta / v_base, 6);
  return new;
end;
$$;

drop trigger if exists trg_item_calcular_factores on item;
create trigger trg_item_calcular_factores
  before insert or update of id_unidad_base, id_unidad_compra, id_unidad_venta
  on item
  for each row execute function fn_item_calcular_factores();

-- Fuerza el cálculo de los factores en las filas ya existentes.
update item set id_unidad_base = id_unidad_base;

-- Convierte una cantidad entre dos unidades usando la unidad base del producto.
create or replace function fn_convertir_unidad(
  p_id_item integer,
  p_desde   integer,
  p_hasta   integer,
  p_cantidad numeric
)
returns numeric
language sql
stable
as $$
  select round(
    p_cantidad
    * (select factor_base from unidad_medida where id_unidad = p_desde)
    / nullif((select factor_base from unidad_medida where id_unidad = p_hasta), 0),
    6
  )
  from item
  where id_item = p_id_item;
$$;

-- Vista usada por el panel para mostrar la lógica de unidades de cada producto.
create or replace view vw_item_unidades as
select i.id_item,
       i.nombre as producto,
       ub.nombre as unidad_base,
       ub.simbolo as simbolo_base,
       uc.nombre as unidad_compra,
       uc.simbolo as simbolo_compra,
       i.factor_compra,
       uv.nombre as unidad_venta,
       uv.simbolo as simbolo_venta,
       i.factor_venta,
       case
         when i.factor_compra is null or i.factor_venta is null then 'incompleto'
         else 'ok'
       end as estado
  from item i
  join unidad_medida ub on ub.id_unidad = i.id_unidad_base
  left join unidad_medida uc on uc.id_unidad = i.id_unidad_compra
  left join unidad_medida uv on uv.id_unidad = i.id_unidad_venta;
