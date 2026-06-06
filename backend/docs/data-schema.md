# Data Schema — Network JSON

This documents the JSON format used for project export/import.

## Top-Level Structure

```json
{
  "name": "My Irrigation Project",
  "exportedAt": "2026-06-06T14:00:00.000Z",
  "nodes": [ ...Node ],
  "edges": [ ...Edge ]
}
```

## Node Schema

### Pump Node
```json
{
  "id": "PUMP_A",
  "name": "Reservoir North",
  "type": "pump",
  "x": 150, "y": 140, "z": 30,
  "maxFlow": 800,
  "pressurePSI": 80
}
```

### Junction Node
```json
{
  "id": "JUNC_1",
  "name": "Pressure Valve 1",
  "type": "junction",
  "x": 400, "y": 230, "z": 20
}
```

### Crop Field Node
```json
{
  "id": "CROP_1",
  "name": "Maize Cultivar A",
  "type": "crop",
  "x": 760, "y": 155, "z": 18,
  "flowDemand": 180,
  "currentReceived": 0,
  "hydration": 15,
  "targetCapacity": 90,
  "maxCapacity": 130,
  "isSupplyEnabled": true,
  "isWateringActive": true
}
```

| Field             | Type    | Description                                              |
|-------------------|---------|----------------------------------------------------------|
| `flowDemand`      | number  | Requested water flow in GPM                              |
| `hydration`       | number  | Current hydration level (0–maxCapacity)                  |
| `targetCapacity`  | number  | Watering stops when hydration reaches this value         |
| `maxCapacity`     | number  | Physical tank/soil maximum capacity                      |
| `isSupplyEnabled` | boolean | Master on/off switch (user controlled)                   |
| `isWateringActive`| boolean | Hysteresis state — false during cooldown after satiation |

## Edge Schema

```json
{
  "id": "PA-J1",
  "from": "PUMP_A",
  "to": "JUNC_1"
}
```

## Hysteresis Rules

- Watering **stops** when `hydration >= targetCapacity`
- Watering **auto-resumes** when `hydration <= targetCapacity * 0.35`
- User can manually override via "Start Watering Now" button
- If `isSupplyEnabled = false`, no watering occurs regardless of hysteresis state
