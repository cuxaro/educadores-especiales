# Educadores Especiales

Catálogo abierto de destinos y puestos de **Educador/a de Educación Especial (C1-04-03)**. El proyecto está diseñado para crecer por provincias y conservar separadas las evidencias históricas de puestos, las adscripciones funcionales y la información oficial de los centros.

## Estado actual · v0.3.1

La web incluye:

- Vista de **Puestos** con búsqueda, ordenación y filtros.
- Vista de **Centros** y ficha individual de cada centro.
- Vista agrupada **Provincia → Localidad → Centro → Puesto**.
- Histórico por número de puesto.
- Distinción entre **ADC**, **RPT** y **adscripción funcional**.
- Centros de Educación Especial (**CEE**) confirmados mediante listado oficial.
- Primeras **UECO** confirmadas mediante la Guía de Centros Docentes de la GVA.
- Unidades y puestos escolares autorizados cuando la Guía de Centros los publica.
- Número de puestos C1 distintos documentados por centro.
- Fotografía específica de puestos presentes en la relación de adscripción funcional de febrero de 2025 cuando existe.
- Enlaces a fuentes oficiales cuando están disponibles.

> El número de “puestos C1 conocidos” no equivale automáticamente a la plantilla actual ni al número de personas que trabajan hoy en un centro. Es el número de identificadores de puesto distintos acreditados en las fuentes recopiladas.

## Estructura de datos

```text
.
├── index.html
├── css/
│   └── app.css
├── js/
│   └── app.js
└── data/
    ├── centros.json
    ├── puestos.json
    ├── apariciones.json
    ├── adscripciones.json
    ├── recursos.json
    └── fuentes.json
```

### Centro

Identidad del centro: nombre, localidad, provincia, tipo, código GVA y, progresivamente, dirección y coordenadas.

### Puesto

Número de puesto y categoría. El mismo número puede prestar servicio en distintos centros a lo largo del tiempo.

### Aparición

Evidencia histórica de un puesto en una fuente concreta: ADC, RPT u otras convocatorias.

### Adscripción funcional

Fotografía fechada del centro real de prestación de servicio y, cuando consta, porcentaje de jornada. Se mantiene separada del ADC porque una adscripción no significa necesariamente que el puesto estuviera vacante.

### Recursos

Información oficial del centro relacionada con Educación Especial, actualmente **CEE** y **UECO**. En las UECO se conservan las unidades y puestos escolares autorizados cuando constan en la Guía de Centros.

## Fuentes prioritarias

1. **Guía de Centros Docentes / Datos Abiertos GVA**: código, centro, localidad, titularidad, dirección, coordenadas y enseñanzas autorizadas.
2. **Listados oficiales de CEE**.
3. **RPT y concursos de traslados C1-04-03**: existencia estructural del puesto.
4. **Adscripciones funcionales**: centro real de prestación de servicio.
5. **ADC / difícil cobertura**: histórico de puestos ofertados y recurrencia.
6. **Elecciones de destino de oposiciones**: puestos ofertados a personal de nuevo ingreso.

## Criterio de trazabilidad

No se sobrescribe el pasado. Si un puesto cambia de adscripción, se añade una nueva evidencia con su fecha y fuente. Los datos no confirmados se mantienen como pendientes en lugar de asignarlos por inferencia.

## Próximas capas

- Completar el universo de UECO y datos oficiales de centros.
- Importar de forma sistemática concursos de traslados y elecciones de destino.
- Dirección y coordenadas para el mapa.
- Métricas de recurrencia por centro y puesto.
- Más provincias.
- Sistema de recomendación binario: **“trabajaría aquí otra vez / no trabajaría aquí otra vez”**.

## GitHub Pages

La web es estática y se publica desde `main` mediante GitHub Pages.
