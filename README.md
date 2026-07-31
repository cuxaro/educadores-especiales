# Educadores Especiales

Catálogo abierto de puestos de Educador/a de Educación Especial, preparado para reunir información de distintas provincias y conservar el histórico de apariciones en ADC, RPT y adscripciones funcionales.

## Qué contiene la v0.1

- Vista de **Puestos** con búsqueda, ordenación y filtros.
- Vista de **Centros**.
- Vista agrupada **Provincia → Localidad → Centro → Puesto**.
- Histórico por número de puesto.
- Distinción entre centro de prestación y centro administrativo cuando se conoce.
- Fuentes diferenciadas como **ADC** y **RPT**.
- Datos separados de la interfaz en JSON.

## Estructura

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
    └── apariciones.json
```

## Modelo de datos

La aplicación separa tres conceptos:

1. **Centro**: nombre, localidad, provincia, tipo y, en el futuro, dirección/coordenadas.
2. **Puesto**: número de puesto y categoría.
3. **Aparición**: una evidencia histórica de ese puesto en un ADC, RPT u otra fuente, asociada al centro que corresponda en ese momento.

Esto permite conservar cambios de adscripción a lo largo del tiempo sin perder el histórico.

## GitHub Pages

La web es completamente estática. Puede publicarse desde la rama `main` y la raíz del repositorio mediante GitHub Pages.

## Próximas mejoras

- Mapa con Leaflet/OpenStreetMap.
- Fichas completas de cada centro.
- Enlaces directos a documentos fuente.
- Más provincias.
- Sistema de recomendación binario: “trabajaría aquí otra vez / no trabajaría aquí otra vez”.

## Estado de los datos

Los datos son una recopilación en construcción. Si un centro no ha podido vincularse con seguridad a un número de puesto, se conserva como pendiente en lugar de inferir una asociación.
