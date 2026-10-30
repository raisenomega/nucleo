<!-- dr-control: ESTADO=PENDIENTE ULTIMO_SIMULACRO=NUNCA CADENCIA_DIAS=90 -->

# Recuperación ante desastre — backup, restore, RTO y RPO

**Ámbito:** el núcleo multi-tenant completo — Postgres, Storage, secretos de plataforma y el propio repo.
**Estado del control:** `PENDIENTE`. Nunca se ha ejecutado ni registrado un simulacro de restore (§4).

## 0. Por qué este documento vive aquí y no en `docs-nucleo/`

`docs-nucleo/` está en `.gitignore` y por doctrina no se commitea, así que **nada de lo que hay ahí viaja
en el clone**. Un procedimiento de desastre que sólo existe en una máquina no existe el día del desastre:
si se pierde el portátil junto con el proveedor, se pierde también el manual para recuperarlo.

Este archivo es, por tanto, la **única** definición de backup/restore del repositorio, y
`scripts/validate-before-push.sh` (§15) lo verifica en cada push y en CI para que no vuelva a desaparecer
ni pueda declararse "verificado" sin evidencia fechada.

## 1. Objetivos — RPO y RTO (compromiso, no descripción)

**RPO** = cuántos datos se acepta perder. **RTO** = en cuánto tiempo hay que estar sirviendo otra vez.
Sin estos dos números "tenemos backups" no es un control: es una esperanza.

| Nivel | Datos | RPO objetivo | RTO objetivo | Por qué |
|---|---|---|---|---|
| T1 | Postgres: libro mayor, facturación, nómina, órdenes, auditoría | **5 min** | **4 h** | dinero y obligación fiscal; lo perdido no se reconstruye desde papel |
| T2 | Storage: documentos firmados, PDFs, logos | **24 h** | **24 h** | regenerable o re-subible; molesto, no letal |
| T3 | Config de plataforma: secretos, webhooks, dominios | **24 h** | **2 h** | poco volumen y alto impacto — sin esto, el restore de T1 no arranca |

## 2. Definición de backup — qué respalda qué

| Activo | Mecanismo | Frecuencia | Retención | ¿Cumple el RPO? |
|---|---|---|---|---|
| Postgres | backups diarios gestionados del plan | 24 h | la del plan | **No para T1** (24 h ≫ 5 min) |
| Postgres | PITR (add-on) | WAL ~2 min | 7 días | Sí para T1 — **SIN VERIFICAR**: confirmar en `Database > Add-ons` y anotar aquí la fecha |
| Storage (buckets) | — | — | — | **No hay copia fuera del proveedor** |
| Secretos (Vault / entorno / claves de terceros) | — | — | — | **No hay copia**; su pérdida bloquea el restore de T1 |
| Código, migraciones y este documento | remoto git + copia externa | por push | histórico completo | Sí |

### Lo que explícitamente NO está cubierto hoy

Se declara por escrito porque un gap conocido es gestionable y un gap implícito es una sorpresa:

1. **Pérdida de la cuenta del proveedor** (suspensión, borrado, compromiso del panel): el backup vive dentro
   del mismo proveedor que estaría caído. No hay copia en un dominio de fallo distinto.
2. **Restore de UN solo tenant**: hoy el restore es todo-o-nada. Corregir el error de un tenant implica
   rebobinar a los 11 restantes; en la práctica eso convierte el PITR en inusable para incidentes de un cliente.
3. **Estado en la pasarela de pago**: suscripciones y cobros no se restauran desde un backup propio;
   se re-sincronizan desde el proveedor. El backup de Postgres **no** es la fuente de verdad de eso.

## 3. Simulacro de restore — la prueba

**Cadencia:** trimestral (`CADENCIA_DIAS=90`) y además tras cualquier migración que altere el esquema de
libro mayor, nómina o auditoría. **Nunca contra producción**: siempre a un proyecto destino desechable.

1. Anotar `T0` (hora de inicio) y el punto de recuperación elegido.
2. Crear el proyecto destino vacío en la misma región.
3. Restaurar: PITR al instante elegido, o el backup diario más reciente.
4. Aplicar las migraciones de `supabase/migrations/` posteriores al punto de recuperación.
5. Ejecutar los criterios de aprobación de abajo.
6. Anotar `T1` = primer login correcto contra el destino. **RTO medido = T1 − T0.**
7. Destruir el proyecto destino y registrar el resultado en §4.

### Criterios de aprobación (todos, o el simulacro es FALLO)

- **a. Esquema completo:** conteo de tablas, funciones y policies del destino == origen.
- **b. RLS intacto:** `apps/web/src/shared/security/rls-coverage.test.ts` en verde apuntando al destino
  (`SUPABASE_PROJECT_REF=<destino> SUPABASE_ACCESS_TOKEN=<token>`). Un restore que recupera filas pero
  pierde policies devuelve los datos de todos los tenants a internet: es peor que no restaurar.
- **c. Aislamiento:** un usuario del tenant A no ve ni una fila del tenant B.
- **d. Integridad contable:** en el mayor restaurado `sum(debe) == sum(haber)`, y el número de facturas del
  último día cerrado coincide con el origen.
- **e. Objetivos cumplidos:** RTO medido ≤ RTO objetivo y RPO medido ≤ RPO objetivo del nivel.

### Evidencia a capturar

Los conteos de (a), la salida de (b), las dos cifras de (d), y `T0`/`T1`. Sin evidencia pegada en §4 el
simulacro **no cuenta**; el guard lo trata como no ejecutado.

## 4. Registro de simulacros

Al registrar uno: añadir la fila, y poner `ESTADO=VERIFICADO ULTIMO_SIMULACRO=YYYY-MM-DD` en la primera
línea del archivo. Si el último simulacro supera `CADENCIA_DIAS`, el guard pone el push y el CI en rojo:
la caducidad es deliberada, porque un restore probado hace dos años no prueba nada sobre el esquema de hoy.

| Fecha | Ejecutó | Origen | RTO medido | RPO medido | Resultado | Evidencia |
|---|---|---|---|---|---|---|
| — | — | — | — | — | **NUNCA EJECUTADO** | — |

## 5. Acciones abiertas

| # | Acción | Bloquea |
|---|---|---|
| DR-1 | Confirmar si PITR está activo y anotarlo en §2 | el RPO de 5 min de T1 |
| DR-2 | Ejecutar el primer simulacro y registrarlo en §4 | poder afirmar que existe backup |
| DR-3 | Copia de Storage y de secretos fuera del proveedor | los gaps 1 y 2 de §2 |
