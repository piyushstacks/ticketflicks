# Database Schema: ticketflicks

> Generated on: 2026-02-27T19:22:21.010Z

## Overview

| Collection | Documents | Size (MB) | Indexes |
|------------|-----------|-----------|---------|
| languages | 7 | 0.001 | 2 |
| screens_new | 4 | 0.009 | 2 |
| genres | 14 | 0.002 | 2 |
| users_new | 9 | 0.002 | 2 |
| bookings_new | 0 | 0.000 | 3 |
| shows | 0 | 0.000 | 3 |
| casts | 20 | 0.002 | 1 |
| shows_new | 0 | 0.000 | 3 |
| screens | 4 | 0.006 | 1 |
| feedbacks | 0 | 0.000 | 1 |
| ratings_reviews | 0 | 0.000 | 3 |
| movies | 6 | 0.076 | 2 |
| show_tbls | 0 | 0.000 | 1 |
| user_tbls | 25 | 0.007 | 2 |
| movie_tbls | 8 | 0.021 | 2 |
| seat_categories | 0 | 0.000 | 1 |
| seats | 0 | 0.000 | 2 |
| screen_tbl | 25 | 0.042 | 4 |
| movies_new | 8 | 0.007 | 2 |
| otp_tbls | 8 | 0.002 | 2 |
| bookings | 14 | 0.005 | 3 |
| payments | 0 | 0.000 | 3 |
| users | 0 | 0.000 | 2 |
| theatres | 7 | 0.026 | 1 |

---

## languages

### Statistics
- **Document Count**: 7
- **Size**: 0.001 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| name_1 | `{"name":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"699ddbd9a9cf05d990ea2eff"`<br>`"699ddbd9a9cf05d990ea2f02"`<br>`"699ddbd9a9cf05d990ea2f05"` |
| name | string | `English`<br>`Hindi`<br>`Tamil` |
| code | string | `en`<br>`hi`<br>`ta` |
| region | string | `United States`<br>`India`<br>`India` |
| createdAt | Date | `"2026-02-24T17:11:53.787Z"`<br>`"2026-02-24T17:11:53.839Z"`<br>`"2026-02-24T17:11:53.906Z"` |
| updatedAt | Date | `"2026-02-24T17:11:53.787Z"`<br>`"2026-02-24T17:11:53.839Z"`<br>`"2026-02-24T17:11:53.906Z"` |
| __v | number | `0`<br>`0`<br>`0` |

### Sample Document
```json
{
  "_id": "699ddbd9a9cf05d990ea2eff",
  "name": "English",
  "code": "en",
  "region": "United States",
  "createdAt": "2026-02-24T17:11:53.787Z",
  "updatedAt": "2026-02-24T17:11:53.787Z",
  "__v": 0
}
```

---

## screens_new

### Statistics
- **Document Count**: 4
- **Size**: 0.009 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| Tid_1 | `{"Tid":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"69a1dd6601f44e8ca5edae84"`<br>`"69a1e7c9b9992471a2efef8e"`<br>`"69a1eae3b9992471a2eff0b3"` |
| Tid | ObjectId | `"69a1dd6601f44e8ca5edae82"`<br>`"69a1e7c9b9992471a2efef8c"`<br>`"69a1eae3b9992471a2eff0b1"` |
| name | string | `Screen 1`<br>`Screen 1`<br>`Screen 1` |
| screenNumber | string | `Screen 1`<br>`Screen 1`<br>`Screen 1` |
| capacity | number | `224`<br>`288`<br>`80` |
| seatLayout | Object | `{"layout":[["S","S","S","S","S","S","S","S","S","S","S","S","S","S"],["S","S","S","S","S","S","S","S`<br>`{"layout":[["S","S","S","S","S","S","S","S","S","S","S","S","S","S","S","S"],["S","S","S","S","S","S`<br>`{"layout":[["C","C","C","C","C","C","C","C"],["C","C","C","C","C","C","C","C"],["C","C","C","C","C",` |
| seatTiers | Array<Object> | `[{"tierName":"Standard","price":150,"rows":["A","B","C","D"],"seatsPerRow":14,"_id":"69a1dd6601f44e8`<br>`[{"tierName":"Standard","price":150,"rows":["A","B","C","D"],"seatsPerRow":16,"_id":"69a1e7c9b999247`<br>`[{"tierName":"Standard","price":500,"rows":["A","B","C","D","E","F","G","H","I","J"],"seatsPerRow":8` |
| isActive | boolean | `true`<br>`true`<br>`true` |
| isDeleted | boolean | `false`<br>`false`<br>`false` |
| __v | number | `0`<br>`0`<br>`0` |
| createdAt | Date | `"2026-02-27T18:07:34.096Z"`<br>`"2026-02-27T18:51:53.440Z"`<br>`"2026-02-27T19:05:07.853Z"` |
| updatedAt | Date | `"2026-02-27T18:07:34.096Z"`<br>`"2026-02-27T18:51:53.440Z"`<br>`"2026-02-27T19:05:07.853Z"` |

### Sample Document
```json
{
  "_id": "69a1dd6601f44e8ca5edae84",
  "Tid": "69a1dd6601f44e8ca5edae82",
  "name": "Screen 1",
  "screenNumber": "Screen 1",
  "capacity": 224,
  "seatLayout": {
    "layout": [
      [
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S"
      ],
      [
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S"
      ],
      [
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S"
      ],
      [
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S",
        "S"
      ],
      [
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D"
      ],
      [
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D"
      ],
      [
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D"
      ],
      [
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D",
        "D"
      ],
      [
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P"
      ],
      [
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P"
      ],
      [
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P"
      ],
      [
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P",
        "P"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ]
    ],
    "rows": 16,
    "seatsPerRow": 14,
    "totalSeats": 224
  },
  "seatTiers": [
    {
      "tierName": "Standard",
      "price": 150,
      "rows": [
        "A",
        "B",
        "C",
        "D"
      ],
      "seatsPerRow": 14,
      "_id": "69a1dd6601f44e8ca5edae85"
    },
    {
      "tierName": "Deluxe",
      "price": 200,
      "rows": [
        "E",
        "F",
        "G",
        "H"
      ],
      "seatsPerRow": 14,
      "_id": "69a1dd6601f44e8ca5edae86"
    },
    {
      "tierName": "Premium",
      "price": 250,
      "rows": [
        "I",
        "J",
        "K",
        "L"
      ],
      "seatsPerRow": 14,
      "_id": "69a1dd6601f44e8ca5edae87"
    },
    {
      "tierName": "Recliner",
      "price": 350,
      "rows": [
        "M",
        "N",
        "O",
        "P"
      ],
      "seatsPerRow": 14,
      "_id": "69a1dd6601f44e8ca5edae88"
    }
  ],
  "isActive": true,
  "isDeleted": false,
  "__v": 0,
  "createdAt": "2026-02-27T18:07:34.096Z",
  "updatedAt": "2026-02-27T18:07:34.096Z"
}
```

---

## genres

### Statistics
- **Document Count**: 14
- **Size**: 0.002 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| name_1 | `{"name":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"699ddbd9a9cf05d990ea2ee7"`<br>`"699ddbd9a9cf05d990ea2eea"`<br>`"699ddbd9a9cf05d990ea2eed"` |
| name | string | `Action`<br>`Drama`<br>`Comedy` |
| description | string | `Action movies with exciting sequences`<br>`Dramatic storytelling`<br>`Comedic entertainment` |
| createdAt | Date | `"2026-02-24T17:11:53.287Z"`<br>`"2026-02-24T17:11:53.348Z"`<br>`"2026-02-24T17:11:53.413Z"` |
| updatedAt | Date | `"2026-02-24T17:11:53.287Z"`<br>`"2026-02-24T17:11:53.348Z"`<br>`"2026-02-24T17:11:53.413Z"` |
| __v | number | `0`<br>`0`<br>`0` |

### Sample Document
```json
{
  "_id": "699ddbd9a9cf05d990ea2ee7",
  "name": "Action",
  "description": "Action movies with exciting sequences",
  "createdAt": "2026-02-24T17:11:53.287Z",
  "updatedAt": "2026-02-24T17:11:53.287Z",
  "__v": 0
}
```

---

## users_new

### Statistics
- **Document Count**: 9
- **Size**: 0.002 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| email_1 | `{"email":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"699dda5252001c43e128d19c"`<br>`"699de002cf5dbe5648cb8b01"`<br>`"69a07a194e18b64b13dacdf5"` |
| name | string | `utsav shah 2`<br>`Yuvraj`<br>`dfbgfbbe` |
| email | string | `utsavs12356@gmail.com`<br>`yuvraj@gmail.com`<br>`erwrg@wrg.wvde` |
| phone | string | `9327001670`<br>`9234189052`<br>`0912334567` |
| password_hash | string | `$2b$10$m8VxUJhNWq48mog6Xat0B.vhjK0MlrrEg1PvIZdQc02J8FN8peTx6`<br>`$2b$10$1gKd089bI7FV7bz4bdvgleXSzp1s6Hb5fTAIGJyaouZ9e6OWS6LOC`<br>`$2b$10$UBkO9jwdahmG8BVUelBK2eBkl/BqtowzmxKyvCPA4IHGWQwg6t7eG` |
| role | string | `admin`<br>`customer`<br>`pending_manager` |
| last_login | Date | `"2026-02-27T18:55:35.305Z"`<br>`"2026-02-24T17:31:14.129Z"`<br>`"2026-02-27T17:14:19.961Z"` |
| createdAt | Date | `"2026-02-24T17:05:22.943Z"`<br>`"2026-02-24T17:29:38.727Z"`<br>`"2026-02-26T16:51:37.094Z"` |
| updatedAt | Date | `"2026-02-27T18:55:35.306Z"`<br>`"2026-02-24T17:31:14.131Z"`<br>`"2026-02-26T16:51:37.094Z"` |
| __v | number | `0`<br>`0`<br>`0` |

### Sample Document
```json
{
  "_id": "699dda5252001c43e128d19c",
  "name": "utsav shah 2",
  "email": "utsavs12356@gmail.com",
  "phone": "9327001670",
  "password_hash": "$2b$10$m8VxUJhNWq48mog6Xat0B.vhjK0MlrrEg1PvIZdQc02J8FN8peTx6",
  "role": "admin",
  "last_login": "2026-02-27T18:55:35.305Z",
  "createdAt": "2026-02-24T17:05:22.943Z",
  "updatedAt": "2026-02-27T18:55:35.306Z",
  "__v": 0
}
```

---

## bookings_new

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 3

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| user_id_1_createdAt_-1 | `{"user_id":1,"createdAt":-1}` |
| show_id_1 | `{"show_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## shows

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 3

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| theater_id_1_show_date_1 | `{"theater_id":1,"show_date":1}` |
| movie_id_1_show_date_1 | `{"movie_id":1,"show_date":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## casts

### Statistics
- **Document Count**: 20
- **Size**: 0.002 MB
- **Indexes**: 1

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"699ddbdaa9cf05d990ea2f14"`<br>`"699ddbdaa9cf05d990ea2f22"`<br>`"699ddbdaa9cf05d990ea2f25"` |
| name | string | `Unknown Actor`<br>`Milla Jovovich`<br>`Dave Bautista` |
| bio | string | `Cast information not available`<br>`Actor: Milla Jovovich`<br>`Actor: Dave Bautista` |
| createdAt | Date | `"2026-02-24T17:11:54.179Z"`<br>`"2026-02-24T17:11:54.526Z"`<br>`"2026-02-24T17:11:54.595Z"` |
| updatedAt | Date | `"2026-02-24T17:11:54.179Z"`<br>`"2026-02-24T17:11:54.526Z"`<br>`"2026-02-24T17:11:54.595Z"` |
| __v | number | `0`<br>`0`<br>`0` |

### Sample Document
```json
{
  "_id": "699ddbdaa9cf05d990ea2f14",
  "name": "Unknown Actor",
  "bio": "Cast information not available",
  "createdAt": "2026-02-24T17:11:54.179Z",
  "updatedAt": "2026-02-24T17:11:54.179Z",
  "__v": 0
}
```

---

## shows_new

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 3

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| theater_id_1_show_date_1 | `{"theater_id":1,"show_date":1}` |
| movie_id_1_show_date_1 | `{"movie_id":1,"show_date":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## screens

### Statistics
- **Document Count**: 4
- **Size**: 0.006 MB
- **Indexes**: 1

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"697b50044a5f9c18ce72bd02"`<br>`"697b52df3ff39d8ff991ee9a"`<br>`"697b64850be0ce8e2373aad1"` |
| screenNumber | string | `1`<br>`2`<br>`3` |
| theatre | ObjectId | `"697b48290c50a205525c3b29"`<br>`"697b48290c50a205525c3b29"`<br>`"697b48290c50a205525c3b29"` |
| seatLayout | Object | `{"rows":10,"seatsPerRow":8,"totalSeats":80}`<br>`{"rows":8,"seatsPerRow":6,"totalSeats":48}`<br>`{"layout":[["S","S","S","S","S","S","S","S","S","S","S","S","S","S","S","S"],["S","S","S","S","S","S` |
| seatTiers | Array<Object> | `[{"tierName":"Couple","price":500,"rows":["A","B","C","D","E","F","G","H","I","J"],"_id":"697b52fb3f`<br>`[{"tierName":"Recliner","price":350,"rows":["A","B","C","D","E","F","G","H"],"_id":"697b52df3ff39d8f`<br>`[{"tierName":"Standard","price":150,"rows":["A","B","C","D"],"_id":"697b64850be0ce8e2373aad2"},{"tie` |
| isActive | boolean | `true`<br>`true`<br>`true` |
| created_at | Date | `"2026-01-29T12:18:12.905Z"`<br>`"2026-01-29T12:30:23.713Z"`<br>`"2026-01-29T13:45:41.693Z"` |
| updated_at | Date | `"2026-01-29T12:30:51.536Z"`<br>`"2026-01-29T12:31:13.817Z"`<br>`"2026-01-29T13:46:04.555Z"` |
| __v | number | `0`<br>`0`<br>`0` |
| name | string | `3`<br>`A` |

### Sample Document
```json
{
  "_id": "697b50044a5f9c18ce72bd02",
  "screenNumber": "1",
  "theatre": "697b48290c50a205525c3b29",
  "seatLayout": {
    "rows": 10,
    "seatsPerRow": 8,
    "totalSeats": 80
  },
  "seatTiers": [
    {
      "tierName": "Couple",
      "price": 500,
      "rows": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H",
        "I",
        "J"
      ],
      "_id": "697b52fb3ff39d8ff991eeb6"
    }
  ],
  "isActive": true,
  "created_at": "2026-01-29T12:18:12.905Z",
  "updated_at": "2026-01-29T12:30:51.536Z",
  "__v": 0
}
```

---

## feedbacks

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 1

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## ratings_reviews

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 3

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| movie_id_1 | `{"movie_id":1}` |
| user_id_1 | `{"user_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## movies

### Statistics
- **Document Count**: 6
- **Size**: 0.076 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| title_1 | `{"title":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | string | `1084242`<br>`1368166`<br>`83533` |
| title | string | `Zootopia 2`<br>`The Housemaid`<br>`Avatar: Fire and Ash` |
| overview | string | `After cracking the biggest case in Zootopia's history, rookie cops Judy Hopps and Nick Wilde find th`<br>`Trying to escape her past, Millie Calloway accepts a job as a live-in housemaid for the wealthy Nina`<br>`In the wake of the devastating war against the RDA and the loss of their eldest son, Jake Sully and ` |
| poster_path | string | `/bjUWGw0Ao0qVWxagN3VCwBJHVo6.jpg`<br>`/cWsBscZzwu5brg9YjNkGewRUvJX.jpg`<br>`/cf7hE1ifY4UNbS25tGnaTyyDrI2.jpg` |
| backdrop_path | string | `/7nfpkR9XsQ1lBNCXSSHxGV7Dkxe.jpg`<br>`/sK3z0Naed3H1Wuh7a21YRVMxYqt.jpg`<br>`/vm4H1DivjQoNIm0Vs6i3CTzFxQ0.jpg` |
| release_date | string | `2025-11-26`<br>`2025-12-18`<br>`2025-12-17` |
| original_language | string | `en`<br>`en`<br>`en` |
| tagline | string | `Zootopia will be changed furrrever...`<br>`Discover what lies behind closed doors.`<br>`The world of Pandora will change forever.` |
| genres | Array<Object> | `[{"id":16,"name":"Animation"},{"id":35,"name":"Comedy"},{"id":12,"name":"Adventure"},{"id":10751,"na`<br>`[{"id":9648,"name":"Mystery"},{"id":53,"name":"Thriller"}]`<br>`[{"id":878,"name":"Science Fiction"},{"id":12,"name":"Adventure"},{"id":14,"name":"Fantasy"}]` |
| casts | Array<Object> | `[{"adult":false,"gender":1,"id":417,"known_for_department":"Acting","name":"Ginnifer Goodwin","origi`<br>`[{"adult":false,"gender":1,"id":115440,"known_for_department":"Acting","name":"Sydney Sweeney","orig`<br>`[{"adult":false,"gender":2,"id":65731,"known_for_department":"Acting","name":"Sam Worthington","orig` |
| vote_average | number | `7.65`<br>`7.572`<br>`7.347` |
| runtime | number | `107`<br>`131`<br>`198` |
| createdAt | Date | `"2026-01-01T17:14:58.133Z"`<br>`"2026-01-01T17:41:26.966Z"`<br>`"2026-01-09T06:16:54.245Z"` |
| updatedAt | Date | `"2026-01-01T17:14:58.133Z"`<br>`"2026-01-01T17:41:26.966Z"`<br>`"2026-01-09T06:16:54.245Z"` |
| __v | number | `0`<br>`0`<br>`0` |

### Sample Document
```json
{
  "_id": "1084242",
  "title": "Zootopia 2",
  "overview": "After cracking the biggest case in Zootopia's history, rookie cops Judy Hopps and Nick Wilde find themselves on the twisting trail of a great mystery when Gary De'Snake arrives and turns the animal metropolis upside down. To crack the case, Judy and Nick must go undercover to unexpected new parts of town, where their growing partnership is tested like never before.",
  "poster_path": "/bjUWGw0Ao0qVWxagN3VCwBJHVo6.jpg",
  "backdrop_path": "/7nfpkR9XsQ1lBNCXSSHxGV7Dkxe.jpg",
  "release_date": "2025-11-26",
  "original_language": "en",
  "tagline": "Zootopia will be changed furrrever...",
  "genres": [
    {
      "id": 16,
      "name": "Animation"
    },
    {
      "id": 35,
      "name": "Comedy"
    },
    {
      "id": 12,
      "name": "Adventure"
    },
    {
      "id": 10751,
      "name": "Family"
    },
    {
      "id": 9648,
      "name": "Mystery"
    }
  ],
  "casts": [
    {
      "adult": false,
      "gender": 1,
      "id": 417,
      "known_for_department": "Acting",
      "name": "Ginnifer Goodwin",
      "original_name": "Ginnifer Goodwin",
      "popularity": 7.0859,
      "profile_path": "/xOCA2WN5MRfXmJmlzEbFEhIbfIQ.jpg",
      "cast_id": 1,
      "character": "Judy Hopps (voice)",
      "credit_id": "63e49b7990fca3007b04f19b",
      "order": 0
    },
    {
      "adult": false,
      "gender": 2,
      "id": 23532,
      "known_for_department": "Acting",
      "name": "Jason Bateman",
      "original_name": "Jason Bateman",
      "popularity": 6.8419,
      "profile_path": "/8e6mt0vGjPo6eW52gqRuXy5YnfN.jpg",
      "cast_id": 16,
      "character": "Nick Wilde (voice)",
      "credit_id": "6448ae740f21c6049827fd5c",
      "order": 1
    },
    {
      "adult": false,
      "gender": 2,
      "id": 690,
      "known_for_department": "Acting",
      "name": "Ke Huy Quan",
      "original_name": "Ke Huy Quan",
      "popularity": 3.9208,
      "profile_path": "/iestHyn7PLuVowj5Jaa1SGPboQ4.jpg",
      "cast_id": 39,
      "character": "Gary De'Snake (voice)",
      "credit_id": "6835e6bfe4057d9ee0037edc",
      "order": 2
    },
    {
      "adult": false,
      "gender": 1,
      "id": 1183672,
      "known_for_department": "Acting",
      "name": "Fortune Feimster",
      "original_name": "Fortune Feimster",
      "popularity": 1.4606,
      "profile_path": "/aCV6S7Tuh9iUmF9on6EwaXC3rCI.jpg",
      "cast_id": 45,
      "character": "Nibbles Maplestick (voice)",
      "credit_id": "6835e72b6d7078c861414b14",
      "order": 3
    },
    {
      "adult": false,
      "gender": 2,
      "id": 62861,
      "known_for_department": "Acting",
      "name": "Andy Samberg",
      "original_name": "Andy Samberg",
      "popularity": 6.2991,
      "profile_path": "/jMXU5oG3i93SH1yhkpbBGskFiJl.jpg",
      "cast_id": 68,
      "character": "Pawbert Lynxley (voice)",
      "credit_id": "68c86a79a13549cb19c905cd",
      "order": 4
    },
    {
      "adult": false,
      "gender": 2,
      "id": 11064,
      "known_for_department": "Acting",
      "name": "David Strathairn",
      "original_name": "David Strathairn",
      "popularity": 2.9826,
      "profile_path": "/6MRnh27jFz0347S6uU11LZG6aaz.jpg",
      "cast_id": 69,
      "character": "Milton Lynxley (voice)",
      "credit_id": "68c86abb6afda362c186892f",
      "order": 5
    },
    {
      "adult": false,
      "gender": 2,
      "id": 17605,
      "known_for_department": "Acting",
      "name": "Idris Elba",
      "original_name": "Idris Elba",
      "popularity": 6.9362,
      "profile_path": "/be1bVF7qGX91a6c5WeRPs5pKXln.jpg",
      "cast_id": 41,
      "character": "Chief Bogo (voice)",
      "credit_id": "6835e6e6f0b6ebbcb0037c37",
      "order": 6
    },
    {
      "adult": false,
      "gender": 1,
      "id": 446511,
      "known_for_department": "Acting",
      "name": "Shakira",
      "original_name": "Shakira",
      "popularity": 1.0263,
      "profile_path": "/AcOA8MbRrDswt6w3TmCBYl7TNOu.jpg",
      "cast_id": 46,
      "character": "Gazelle (voice)",
      "credit_id": "6835e749f3c1664346414d91",
      "order": 7
    },
    {
      "adult": false,
      "gender": 2,
      "id": 9657,
      "known_for_department": "Acting",
      "name": "Patrick Warburton",
      "original_name": "Patrick Warburton",
      "popularity": 4.9543,
      "profile_path": "/nDoOii5HaGwPxYa28xFC2sDkF8y.jpg",
      "cast_id": 62,
      "character": "Mayor Brian Winddancer (voice)",
      "credit_id": "6895e6c20d49cd86557f71b6",
      "order": 8
    },
    {
      "adult": false,
      "gender": 1,
      "id": 1745988,
      "known_for_department": "Acting",
      "name": "Quinta Brunson",
      "original_name": "Quinta Brunson",
      "popularity": 1.2725,
      "profile_path": "/50gY1qgG5ddSLPY77K8zAq9TwJo.jpg",
      "cast_id": 47,
      "character": "Dr. Fuzzby (voice)",
      "credit_id": "6835e75c6368702a21b6bd88",
      "order": 9
    },
    {
      "adult": false,
      "gender": 2,
      "id": 11160,
      "known_for_department": "Acting",
      "name": "Danny Trejo",
      "original_name": "Danny Trejo",
      "popularity": 4.0727,
      "profile_path": "/7JrUkRGBscZ1Hy5JinaaXjjzSCF.jpg",
      "cast_id": 72,
      "character": "Jesús (voice)",
      "credit_id": "68db284e400de613efb41dbb",
      "order": 10
    },
    {
      "adult": false,
      "gender": 2,
      "id": 41565,
      "known_for_department": "Acting",
      "name": "Nate Torrence",
      "original_name": "Nate Torrence",
      "popularity": 1.1456,
      "profile_path": "/yT9o149xPygdY0NsF9sNgiQwuru.jpg",
      "cast_id": 43,
      "character": "Officer Benjamin Clawhauser (voice)",
      "credit_id": "6835e70b9253d5acf07304c8",
      "order": 11
    },
    {
      "adult": false,
      "gender": 1,
      "id": 5149,
      "known_for_department": "Acting",
      "name": "Bonnie Hunt",
      "original_name": "Bonnie Hunt",
      "popularity": 4.1422,
      "profile_path": "/tT9C6uLztgN8OxJULq6F9iEzqlA.jpg",
      "cast_id": 52,
      "character": "Bonnie Hopps (voice)",
      "credit_id": "688b65b0670906d6ba09dd6c",
      "order": 12
    },
    {
      "adult": false,
      "gender": 2,
      "id": 27530,
      "known_for_department": "Acting",
      "name": "Don Lake",
      "original_name": "Don Lake",
      "popularity": 0.9475,
      "profile_path": "/zVcMF2Jtv1W3mvzYDE3JiFfw2PG.jpg",
      "cast_id": 53,
      "character": "Stu Hopps (voice)",
      "credit_id": "688b65bfad950ede3a5e3172",
      "order": 13
    },
    {
      "adult": false,
      "gender": 1,
      "id": 144250,
      "known_for_department": "Acting",
      "name": "Michelle Gomez",
      "original_name": "Michelle Gomez",
      "popularity": 1.1213,
      "profile_path": "/jEkZsW1hviRjgGcWLwgdit7vONJ.jpg",
      "cast_id": 90,
      "character": "Captain Hoggbottom (voice)",
      "credit_id": "69143321a33449c0669c48f2",
      "order": 14
    },
    {
      "adult": false,
      "gender": 2,
      "id": 55937,
      "known_for_department": "Acting",
      "name": "David Fane",
      "original_name": "David Fane",
      "popularity": 1.001,
      "profile_path": "/tcozyaTgAa8rRmzc5qeht0loni6.jpg",
      "cast_id": 82,
      "character": "Truffler (voice)",
      "credit_id": "68ffb1f64b781d18059fb550",
      "order": 15
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1170011,
      "known_for_department": "Acting",
      "name": "Joe Anoa'i",
      "original_name": "Joe Anoa'i",
      "popularity": 2.428,
      "profile_path": "/6BKc77eAUBQdL9MmgBorBc4SMdE.jpg",
      "cast_id": 91,
      "character": "Zebro Zebraxton (voice)",
      "credit_id": "6914338df2781b680931bf54",
      "order": 16
    },
    {
      "adult": false,
      "gender": 2,
      "id": 565430,
      "known_for_department": "Acting",
      "name": "Phil Brooks",
      "original_name": "Phil Brooks",
      "popularity": 1.61,
      "profile_path": "/m6xScKNRVfA7CyMJaPZ5TZmIZlh.jpg",
      "cast_id": 92,
      "character": "Zebro Zebrowski (voice)",
      "credit_id": "691433d047d1fab49c31bfa0",
      "order": 17
    },
    {
      "adult": false,
      "gender": 1,
      "id": 968367,
      "known_for_department": "Acting",
      "name": "Stephanie Beatriz",
      "original_name": "Stephanie Beatriz",
      "popularity": 2.7302,
      "profile_path": "/7gNPOlsVIdg7QQOv1gRfHjv1Sdb.jpg",
      "cast_id": 78,
      "character": "Bloats (voice)",
      "credit_id": "68ffb1a31d088d944dfb73fc",
      "order": 18
    },
    {
      "adult": false,
      "gender": 2,
      "id": 18975,
      "known_for_department": "Acting",
      "name": "Wilmer Valderrama",
      "original_name": "Wilmer Valderrama",
      "popularity": 2.9821,
      "profile_path": "/uohkEwMGIGCq4k8P2AiomuKQwYv.jpg",
      "cast_id": 63,
      "character": "Higgins (voice)",
      "credit_id": "6895e6d4ef786223fd9db752",
      "order": 19
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1003,
      "known_for_department": "Acting",
      "name": "Jean Reno",
      "original_name": "Jean Reno",
      "popularity": 4.9735,
      "profile_path": "/mw0EZJYz3kiFq9fNxsML773gotF.jpg",
      "cast_id": 48,
      "character": "Bûcheron / Chèvre (voice)",
      "credit_id": "684bf534933b5d32a13fdd7d",
      "order": 20
    },
    {
      "adult": false,
      "gender": 2,
      "id": 21088,
      "known_for_department": "Acting",
      "name": "Alan Tudyk",
      "original_name": "Alan Tudyk",
      "popularity": 3.4605,
      "profile_path": "/jUuUbPuMGonFT5E2pcs4alfqaCN.jpg",
      "cast_id": 54,
      "character": "Duke Weaselton / French Chef / Molt Kahl / Reporter (voice)",
      "credit_id": "688b661de2f08f0402948afe",
      "order": 21
    },
    {
      "adult": false,
      "gender": 2,
      "id": 11510,
      "known_for_department": "Acting",
      "name": "Macaulay Culkin",
      "original_name": "Macaulay Culkin",
      "popularity": 11.1919,
      "profile_path": "/5We9Y4zUJ5TUnRgfmkzWQx0mLIF.jpg",
      "cast_id": 60,
      "character": "Cattrick Lynxley (voice)",
      "credit_id": "6894d31442a817dc7007c6d7",
      "order": 22
    },
    {
      "adult": false,
      "gender": 1,
      "id": 88123,
      "known_for_department": "Acting",
      "name": "Brenda Song",
      "original_name": "Brenda Song",
      "popularity": 3.2686,
      "profile_path": "/1vLlotlVcvfESzXWCk8p1RKQqV7.jpg",
      "cast_id": 61,
      "character": "Kitty Lynxley (voice)",
      "credit_id": "6894d31e473102d13207c658",
      "order": 23
    },
    {
      "adult": false,
      "gender": 2,
      "id": 5723,
      "known_for_department": "Acting",
      "name": "John Leguizamo",
      "original_name": "John Leguizamo",
      "popularity": 3.5847,
      "profile_path": "/kwYCdxTlDh9zauUCg4mp2XTCQTw.jpg",
      "cast_id": 80,
      "character": "Antony Snootley (voice)",
      "credit_id": "68ffb1cb67ed119f56276549",
      "order": 24
    },
    {
      "adult": false,
      "gender": 2,
      "id": 8396,
      "known_for_department": "Acting",
      "name": "Tommy Lister Jr.",
      "original_name": "Tommy Lister Jr.",
      "popularity": 2.3209,
      "profile_path": "/i1seZDiLC3AKrAYqfFSln6ZGNmF.jpg",
      "cast_id": 71,
      "character": "Finnick (voice) (archive sound)",
      "credit_id": "68d4a3cda49d04ea88881ea7",
      "order": 25
    },
    {
      "adult": false,
      "gender": 2,
      "id": 34521,
      "known_for_department": "Acting",
      "name": "Maurice LaMarche",
      "original_name": "Maurice LaMarche",
      "popularity": 1.2499,
      "profile_path": "/qCiL3EYAhLcNo0rNj5pczWo9MwG.jpg",
      "cast_id": 44,
      "character": "Mr. Big (voice)",
      "credit_id": "6835e71dda04f9deb7414b25",
      "order": 26
    },
    {
      "adult": false,
      "gender": 1,
      "id": 1502450,
      "known_for_department": "Acting",
      "name": "Leah Latham",
      "original_name": "Leah Latham",
      "popularity": 0.4404,
      "profile_path": "/gZDFLHGypGElfyOGeWufLHZjgi8.jpg",
      "cast_id": 55,
      "character": "Fru Fru (voice)",
      "credit_id": "688b6642b1436de63a51d3b3",
      "order": 27
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1223658,
      "known_for_department": "Acting",
      "name": "Raymond S. Persi",
      "original_name": "Raymond S. Persi",
      "popularity": 1.8002,
      "profile_path": "/37HnYfTAHhtAmWdl4NlVAOR7vCW.jpg",
      "cast_id": 59,
      "character": "Flash (voice)",
      "credit_id": "688b6694e211b52bc651d506",
      "order": 28
    },
    {
      "adult": false,
      "gender": 1,
      "id": 213001,
      "known_for_department": "Acting",
      "name": "Jenny Slate",
      "original_name": "Jenny Slate",
      "popularity": 4.3946,
      "profile_path": "/aqH8MCnT3O5Od3OfZR8LClSP7UB.jpg",
      "cast_id": 40,
      "character": "Dawn Bellwether (voice)",
      "credit_id": "6835e6d3a4f5e75043b6dbaf",
      "order": 29
    },
    {
      "adult": false,
      "gender": 2,
      "id": 77880,
      "known_for_department": "Acting",
      "name": "Josh Dallas",
      "original_name": "Josh Dallas",
      "popularity": 1.6047,
      "profile_path": "/s1PwBl0ZaZE6E0OmZF5OeyfXDDk.jpg",
      "cast_id": 56,
      "character": "Frantic Pig (voice)",
      "credit_id": "688b665549024bcb52b5b42e",
      "order": 30
    },
    {
      "adult": false,
      "gender": 2,
      "id": 63208,
      "known_for_department": "Acting",
      "name": "Tommy Chong",
      "original_name": "Tommy Chong",
      "popularity": 1.1234,
      "profile_path": "/4jCJpbssCSGc5jhmrBMoGvWNQDf.jpg",
      "cast_id": 57,
      "character": "Yax (voice)",
      "credit_id": "688b666c3b47e14036b5b412",
      "order": 31
    },
    {
      "adult": false,
      "gender": 1,
      "id": 1564846,
      "known_for_department": "Acting",
      "name": "Auliʻi Cravalho",
      "original_name": "Auliʻi Cravalho",
      "popularity": 1.7801,
      "profile_path": "/vEroqcnM2g6yY7qXDAie7hx2Cyp.jpg",
      "cast_id": 76,
      "character": "Anti-Venom Pen (voice)",
      "credit_id": "68ffb1571abe9b90089390df",
      "order": 32
    },
    {
      "adult": false,
      "gender": 2,
      "id": 521,
      "known_for_department": "Acting",
      "name": "Michael J. Fox",
      "original_name": "Michael J. Fox",
      "popularity": 3.4432,
      "profile_path": "/c8wWX6QsmrvwZ1flHF5iprAPdK7.jpg",
      "cast_id": 115,
      "character": "Michael J. The Fox (voice)",
      "credit_id": "69143791a33449c0669c4905",
      "order": 33
    },
    {
      "adult": false,
      "gender": 2,
      "id": 18918,
      "known_for_department": "Acting",
      "name": "Dwayne Johnson",
      "original_name": "Dwayne Johnson",
      "popularity": 6.4787,
      "profile_path": "/dKVK6FoCij8Rig8P5xbu8bK4EWC.jpg",
      "cast_id": 124,
      "character": "Zeke AKA That Dik-Dik Stuck in that Tuba (voice)",
      "credit_id": "6914382891a3814cebdd2b88",
      "order": 34
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1610448,
      "known_for_department": "Acting",
      "name": "Hewitt Bush",
      "original_name": "Hewitt Bush",
      "popularity": 0.1259,
      "profile_path": null,
      "cast_id": 93,
      "character": "Armpit Pete (voice)",
      "credit_id": "6914358a380a6254f1875eeb",
      "order": 35
    },
    {
      "adult": false,
      "gender": 2,
      "id": 4564359,
      "known_for_department": "Acting",
      "name": "Blake Slatkin",
      "original_name": "Blake Slatkin",
      "popularity": 0.1272,
      "profile_path": null,
      "cast_id": 94,
      "character": "Baalake Lambkin (voice)",
      "credit_id": "69143605e24e363ff9875d23",
      "order": 36
    },
    {
      "adult": false,
      "gender": 2,
      "id": 3685845,
      "known_for_department": "Acting",
      "name": "Nick DiGiovanni",
      "original_name": "Nick DiGiovanni",
      "popularity": 0.3298,
      "profile_path": "/nhilXZ9j8CJhjIlFfSASvRE8tZO.jpg",
      "cast_id": 95,
      "character": "Bartender Slick Di’Giguani (voice)",
      "credit_id": "69143615c5c5faff3aa0d60a",
      "order": 37
    },
    {
      "adult": false,
      "gender": 1,
      "id": 220088,
      "known_for_department": "Acting",
      "name": "Tig Notaro",
      "original_name": "Tig Notaro",
      "popularity": 0.7546,
      "profile_path": "/tdZ6XLzIaK0HWWPSM2B5OrOqUC0.jpg",
      "cast_id": 96,
      "character": "Big Tig (voice)",
      "credit_id": "6914362a087f7fce383a3af1",
      "order": 38
    },
    {
      "adult": false,
      "gender": 2,
      "id": 5811979,
      "known_for_department": "Acting",
      "name": "Sasha Piqué Mebarak",
      "original_name": "Sasha Piqué Mebarak",
      "popularity": 0.0654,
      "profile_path": null,
      "cast_id": 97,
      "character": "Binkston S. Hopps (voice)",
      "credit_id": "691436414d06e33f414c8d39",
      "order": 39
    },
    {
      "adult": false,
      "gender": 2,
      "id": 5811980,
      "known_for_department": "Acting",
      "name": "Milan Piqué Mebarak",
      "original_name": "Milan Piqué Mebarak",
      "popularity": 0.1377,
      "profile_path": null,
      "cast_id": 98,
      "character": "Binky M. Hopps (voice)",
      "credit_id": "6914365134eec9d9e7dd2c81",
      "order": 40
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1904707,
      "known_for_department": "Acting",
      "name": "Jake Robards",
      "original_name": "Jake Robards",
      "popularity": 0.5037,
      "profile_path": "/zcbnJYogZXIRPVHL8Pwaticx8zt.jpg",
      "cast_id": 99,
      "character": "BJ Hornsby (voice)",
      "credit_id": "691436660ff15da6849ace0c",
      "order": 41
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1299481,
      "known_for_department": "Acting",
      "name": "Bob Iger",
      "original_name": "Bob Iger",
      "popularity": 0.7315,
      "profile_path": "/qD3fjtSSrWgm1VmvpD1kXH4l18H.jpg",
      "cast_id": 100,
      "character": "Bob Tiger (voice)",
      "credit_id": "69143678e8d241e7b5c06b81",
      "order": 42
    },
    {
      "adult": false,
      "gender": 0,
      "id": 1658437,
      "known_for_department": "Acting",
      "name": "Daniel V. Graulau",
      "original_name": "Daniel V. Graulau",
      "popularity": 1.9491,
      "profile_path": null,
      "cast_id": 101,
      "character": "Buzz Shedley (voice)",
      "credit_id": "691436890cbb5899053a3a23",
      "order": 43
    },
    {
      "adult": false,
      "gender": 1,
      "id": 2936174,
      "known_for_department": "Acting",
      "name": "Amanda Gorman",
      "original_name": "Amanda Gorman",
      "popularity": 0.2423,
      "profile_path": "/65nwhL4jFsdWAv38tWX3KEAF4em.jpg",
      "cast_id": 102,
      "character": "Deerdra Bambino (voice)",
      "credit_id": "6914369f7a7eb793f69ad2aa",
      "order": 44
    },
    {
      "adult": false,
      "gender": 2,
      "id": 998387,
      "known_for_department": "Acting",
      "name": "Ed Sheeran",
      "original_name": "Ed Sheeran",
      "popularity": 2.2438,
      "profile_path": "/uecUgTQAJnoQVxzjUNACaal3AJD.jpg",
      "cast_id": 103,
      "character": "Ed Shearin (voice)",
      "credit_id": "691436b341b0b93d78a0d6bd",
      "order": 45
    },
    {
      "adult": false,
      "gender": 1,
      "id": 111513,
      "known_for_department": "Acting",
      "name": "Yvette Nicole Brown",
      "original_name": "Yvette Nicole Brown",
      "popularity": 1.2081,
      "profile_path": "/7cJowCcDPnyXqHJ46GgSNHomUGo.jpg",
      "cast_id": 104,
      "character": "EMT Otter / The Bearoness (voice)",
      "credit_id": "691436c770048d82ec9acec4",
      "order": 46
    },
    {
      "adult": false,
      "gender": 1,
      "id": 1262228,
      "known_for_department": "Acting",
      "name": "Tiffany Lonsdale",
      "original_name": "Tiffany Lonsdale",
      "popularity": 0.5807,
      "profile_path": "/af1hRdTtlWqTbg8axVS79ki4niD.jpg",
      "cast_id": 105,
      "character": "Gala Announcer (voice)",
      "credit_id": "691436d6a5ef06b8d24c8b7f",
      "order": 47
    },
    {
      "adult": false,
      "gender": 2,
      "id": 113821,
      "known_for_department": "Acting",
      "name": "George Pennacchio",
      "original_name": "George Pennacchio",
      "popularity": 0.1706,
      "profile_path": null,
      "cast_id": 106,
      "character": "George Purrrnacleo (voice)",
      "credit_id": "691436e34ad087595b875edc",
      "order": 48
    },
    {
      "adult": false,
      "gender": 2,
      "id": 76595,
      "known_for_department": "Directing",
      "name": "Byron Howard",
      "original_name": "Byron Howard",
      "popularity": 2.369,
      "profile_path": "/ePJXkxrD44nM0VB7Xx9Q4ityzfT.jpg",
      "cast_id": 107,
      "character": "Berthold Hufschmerz / Bucky / Joel (voice)",
      "credit_id": "691436fb9e0edb599f875e0b",
      "order": 49
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1318201,
      "known_for_department": "Writing",
      "name": "Jared Bush",
      "original_name": "Jared Bush",
      "popularity": 2.792,
      "profile_path": "/50XtrC5NMcqiYMXNmuNVY5tUl34.jpg",
      "cast_id": 108,
      "character": "Jürgen Ziegenkäse / Pronk (voice)",
      "credit_id": "6914370d0d1d06c2f031be22",
      "order": 50
    },
    {
      "adult": false,
      "gender": 1,
      "id": 35515,
      "known_for_department": "Acting",
      "name": "June Squibb",
      "original_name": "June Squibb",
      "popularity": 1.0905,
      "profile_path": "/a7vkoLhc8JGkdvDbHvpgKKHUPHH.jpg",
      "cast_id": 109,
      "character": "Gram Gram (voice)",
      "credit_id": "6914371b44d974b7e99c49e3",
      "order": 51
    },
    {
      "adult": false,
      "gender": 1,
      "id": 15298,
      "known_for_department": "Acting",
      "name": "Rachel House",
      "original_name": "Rachel House",
      "popularity": 1.7927,
      "profile_path": "/2LCQF7Bn0I91o17GGkox0ZhhbE7.jpg",
      "cast_id": 110,
      "character": "Gramma Taller (voice)",
      "credit_id": "6914372bc1daa774efc06b41",
      "order": 52
    },
    {
      "adult": false,
      "gender": 1,
      "id": 1462583,
      "known_for_department": "Acting",
      "name": "Melissa Goodwin Shepherd",
      "original_name": "Melissa Goodwin Shepherd",
      "popularity": 0.36,
      "profile_path": "/171ZApY6MmMBvn50vxaSDheulVH.jpg",
      "cast_id": 111,
      "character": "Knife Mouse (voice)",
      "credit_id": "69143744d20f50e31d3a3c3a",
      "order": 53
    },
    {
      "adult": false,
      "gender": 1,
      "id": 1093919,
      "known_for_department": "Acting",
      "name": "Cecily Strong",
      "original_name": "Cecily Strong",
      "popularity": 0.8693,
      "profile_path": "/g1WbsojbgQAB72UfUJnNWPaB4b5.jpg",
      "cast_id": 112,
      "character": "Little Judith (voice)",
      "credit_id": "69143762a33449c0669c4901",
      "order": 54
    },
    {
      "adult": false,
      "gender": 1,
      "id": 1687265,
      "known_for_department": "Acting",
      "name": "Allegra Leguizamo",
      "original_name": "Allegra Leguizamo",
      "popularity": 0.3154,
      "profile_path": null,
      "cast_id": 113,
      "character": "Marina Nutriamo (voice)",
      "credit_id": "69143772eacffe65b23a39d4",
      "order": 55
    },
    {
      "adult": false,
      "gender": 2,
      "id": 19185,
      "known_for_department": "Acting",
      "name": "Mario López",
      "original_name": "Mario López",
      "popularity": 2.197,
      "profile_path": "/b9bGymfTx7Zgv26fp44mHnlPnZT.jpg",
      "cast_id": 114,
      "character": "Denny Howlett (voice)",
      "credit_id": "69143782c4ea5b5c2e3a3a84",
      "order": 56
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1214974,
      "known_for_department": "Acting",
      "name": "Mark Rhino Smith",
      "original_name": "Mark Rhino Smith",
      "popularity": 0.9207,
      "profile_path": "/cp06Vtw9yNgexpQVoHsoMJkTRlL.jpg",
      "cast_id": 116,
      "character": "Officer McHorn (voice)",
      "credit_id": "691437a19d938a061f9ace99",
      "order": 57
    },
    {
      "adult": false,
      "gender": 2,
      "id": 54415,
      "known_for_department": "Acting",
      "name": "Josh Gad",
      "original_name": "Josh Gad",
      "popularity": 2.6572,
      "profile_path": "/bgRWcrD9hfaa2f7RUWJzxmJaWuD.jpg",
      "cast_id": 117,
      "character": "Paul Moledebrandt (voice)",
      "credit_id": "691437b96cb3e5b8574c8e75",
      "order": 58
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1374597,
      "known_for_department": "Acting",
      "name": "Peter Mansbridge",
      "original_name": "Peter Mansbridge",
      "popularity": 1.5827,
      "profile_path": "/8z25p4T6c3PkqU3cyV2c777SiFz.jpg",
      "cast_id": 118,
      "character": "Peter Moosebridge (voice)",
      "credit_id": "691437c8a07ed93f07dd2e7b",
      "order": 59
    },
    {
      "adult": false,
      "gender": 2,
      "id": 1924479,
      "known_for_department": "Acting",
      "name": "Robert Irwin",
      "original_name": "Robert Irwin",
      "popularity": 0.8241,
      "profile_path": "/eiI8GH57qpej7d7uEhsUG0kK6Ct.jpg",
      "cast_id": 119,
      "character": "Robert Furwin (voice)",
      "credit_id": "691437dcd0450fa3063a3b4b",
      "order": 60
    },
    {
      "adult": false,
      "gender": 0,
      "id": 3168248,
      "known_for_department": "Art",
      "name": "David VanTuyle",
      "original_name": "David VanTuyle",
      "popularity": 0.0592,
      "profile_path": null,
      "cast_id": 120,
      "character": "Russ (voice)",
      "credit_id": "691437e85b452b4483a0d6f3",
      "order": 61
    },
    {
      "adult": false,
      "gender": 1,
      "id": 15563,
      "known_for_department": "Acting",
      "name": "Anika Noni Rose",
      "original_name": "Anika Noni Rose",
      "popularity": 1.6992,
      "profile_path": "/d7aLtuNXBqVtqNnZl8wXsFV4ML5.jpg",
      "cast_id": 121,
      "character": "Squeal of Fortune (voice)",
      "credit_id": "691437f663fc15e27b9c49c6",
      "order": 62
    },
    {
      "adult": false,
      "gender": 1,
      "id": 5811993,
      "known_for_department": "Acting",
      "name": "Taylen Biggs",
      "original_name": "Taylen Biggs",
      "popularity": 0.0775,
      "profile_path": null,
      "cast_id": 122,
      "character": "Tailen Smalls (voice)",
      "credit_id": "69143809dfa0d78076875cd9",
      "order": 63
    },
    {
      "adult": false,
      "gender": 3,
      "id": 2544703,
      "known_for_department": "Acting",
      "name": "Mae Martin",
      "original_name": "Mae Martin",
      "popularity": 2.9504,
      "profile_path": "/y4XD7mLEcV7cPOk2BOsX1hCSKun.jpg",
      "cast_id": 123,
      "character": "Tuffy Cheeksworth (voice)",
      "credit_id": "6914381895aa21afb7a0d589",
      "order": 64
    },
    {
      "adult": false,
      "gender": 0,
      "id": 5812481,
      "known_for_department": "Acting",
      "name": "Natalia Adame Mendoza",
      "original_name": "Natalia Adame Mendoza",
      "popularity": 0.0379,
      "profile_path": null,
      "cast_id": 125,
      "character": "Additional Voices (voice)",
      "credit_id": "69147fcec5c5faff3aa0d78d",
      "order": 65
    },
    {
      "adult": false,
      "gender": 0,
      "id": 5812482,
      "known_for_department": "Acting",
      "name": "Emmitt Bush",
      "original_name": "Emmitt Bush",
      "popularity": 0.0695,
      "profile_path": null,
      "cast_id": 126,
      "character": "Additional Voices (voice)",
      "credit_id": "69147fd855b34f734fa0d557",
      "order": 66
    },
    {
      "adult": false,
      "gender": 0,
      "id": 5812484,
      "known_for_department": "Acting",
      "name": "Merrick Bush",
      "original_name": "Merrick Bush",
      "popularity": 0.0481,
      "profile_path": null,
      "cast_id": 127,
      "character": "Additional Voices (voice)",
      "credit_id": "69147fe0a4a1c96cc831c209",
      "order": 67
    },
    {
      "adult": false,
      "gender": 1,
      "id": 2819409,
      "known_for_department": "Writing",
      "name": "Carrie Liao",
      "original_name": "Carrie Liao",
      "popularity": 0.4703,
      "profile_path": "/gGzDW5QZOwtbypKvBpyp3OwMJ7p.jpg",
      "cast_id": 128,
      "character": "Additional Voices (voice)",
      "credit_id": "69147fe978d69718849c49ff",
      "order": 68
    },
    {
      "adult": false,
      "gender": 2,
      "id": 967699,
      "known_for_department": "Editing",
      "name": "Jeremy Milton",
      "original_name": "Jeremy Milton",
      "popularity": 0.4488,
      "profile_path": "/AkjmE1qLyurqBOJ4tUGafWk4kd4.jpg",
      "cast_id": 129,
      "character": "Additional Voices (voice)",
      "credit_id": "69147ff06e28e624218760a9",
      "order": 69
    },
    {
      "adult": false,
      "gender": 1,
      "id": 44029,
      "known_for_department": "Editing",
      "name": "Fabienne Rawley",
      "original_name": "Fabienne Rawley",
      "popularity": 0.427,
      "profile_path": "/94hWzJiJskQYepoxrHg1wZ2Yc2G.jpg",
      "cast_id": 130,
      "character": "Additional Voices (voice)",
      "credit_id": "69147ff7a3d94d8baa31bf5b",
      "order": 70
    }
  ],
  "vote_average": 7.65,
  "runtime": 107,
  "createdAt": "2026-01-01T17:14:58.133Z",
  "updatedAt": "2026-01-01T17:14:58.133Z",
  "__v": 0
}
```

---

## show_tbls

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 1

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## user_tbls

### Statistics
- **Document Count**: 25
- **Size**: 0.007 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| email_1 | `{"email":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"696fbef17f88e12abbe4fedf"`<br>`"697652df8aec543220324105"`<br>`"697658424169169a357ea4f3"` |
| name | string | `piyush`<br>`Riya`<br>`Utsav Shah` |
| email | string | `piyushbhagchandani.64@gmail.com`<br>`nihix32853@okexbit.com`<br>`utsavs12356@gmail.com` |
| phone | string | `9724176335`<br>`1212312343`<br>`9090912121` |
| password_hash | string | `$2b$10$/v3604NizEH/cAokqjFlf.y4kHmCjpvEUJAK/G1WvGwkyMJMkHXjG`<br>`$2b$10$a9byQ9m2TJKq.lyU4U6J7uEcGn1RqA2.wLGOFGT9r.Vic.feVwcEa`<br>`$2b$10$MVDxOEfyFGKfwf5N.k86QepNAoGEi57kyAodrYpGcryc3SWhWRk4e` |
| role | string | `customer`<br>`customer`<br>`admin` |
| last_login | Date | `"2026-01-25T11:58:09.317Z"`<br>`"2026-01-25T17:45:23.514Z"`<br>`"2026-02-26T17:54:46.775Z"` |
| favorites | Array | `[]`<br>`[]`<br>`[]` |
| created_at | Date | `"2026-01-20T17:44:17.015Z"`<br>`"2026-01-25T17:29:03.932Z"`<br>`"2026-01-25T17:52:02.716Z"` |
| updated_at | Date | `"2026-01-25T11:58:09.317Z"`<br>`"2026-01-25T17:45:23.515Z"`<br>`"2026-02-26T17:54:46.775Z"` |
| __v | number | `0`<br>`0`<br>`0` |
| address | Object | `{"country":"IN"}` |

### Sample Document
```json
{
  "_id": "696fbef17f88e12abbe4fedf",
  "name": "piyush",
  "email": "piyushbhagchandani.64@gmail.com",
  "phone": "9724176335",
  "password_hash": "$2b$10$/v3604NizEH/cAokqjFlf.y4kHmCjpvEUJAK/G1WvGwkyMJMkHXjG",
  "role": "customer",
  "last_login": "2026-01-25T11:58:09.317Z",
  "favorites": [],
  "created_at": "2026-01-20T17:44:17.015Z",
  "updated_at": "2026-01-25T11:58:09.317Z",
  "__v": 0
}
```

---

## movie_tbls

### Statistics
- **Document Count**: 8
- **Size**: 0.021 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| tmdbId_1 | `{"tmdbId":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"6977b5efec98f5d286477f7d"`<br>`"6977b5efec98f5d286477f7f"`<br>`"6977b5efec98f5d286477f82"` |
| title | string | `In the Lost Lands`<br>`Lilo & Stitch`<br>`Mission: Impossible - The Final Reckoning` |
| overview | string | `A queen sends the powerful and feared sorceress Gray Alys to the ghostly wilderness of the Lost Land`<br>`The wildly funny and touching story of a lonely Hawaiian girl and the fugitive alien who helps to me`<br>`Ethan Hunt and team continue their search for the terrifying AI known as the Entity — which has infi` |
| poster_path | string | `https://image.tmdb.org/t/p/original/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg`<br>`https://image.tmdb.org/t/p/original/mKKqV23MQ0uakJS8OCE2TfV5jNS.jpg`<br>`https://image.tmdb.org/t/p/original/z53D72EAOxGRqdr7KXXWp9dJiDe.jpg` |
| backdrop_path | string | `https://image.tmdb.org/t/p/original/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg`<br>`https://image.tmdb.org/t/p/original/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg`<br>`https://image.tmdb.org/t/p/original/1p5aI299YBnqrEEvVGJERk2MXXb.jpg` |
| release_date | Date | `"2025-02-27T00:00:00.000Z"`<br>`"2025-05-17T00:00:00.000Z"`<br>`"2025-05-17T00:00:00.000Z"` |
| original_language | string | `hi`<br>`en`<br>`en` |
| tagline | string | `She seeks the power to free her people.`<br>`Hold on to your coconuts.`<br>`Our lives are the sum of our choices.` |
| genres | Array<Object> | `[{"id":28,"name":"Action"},{"id":14,"name":"Fantasy"},{"id":12,"name":"Adventure"}]`<br>`[{"id":10751,"name":"Family"},{"id":35,"name":"Comedy"},{"id":878,"name":"Science Fiction"}]`<br>`[{"id":28,"name":"Action"},{"id":12,"name":"Adventure"},{"id":53,"name":"Thriller"}]` |
| casts | Array<Object> | `[{"name":"Milla Jovovich","profile_path":"https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0q`<br>`[{"name":"Milla Jovovich","profile_path":"https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0q`<br>`[{"name":"Milla Jovovich","profile_path":"https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0q` |
| vote_average | number | `6.4`<br>`7.117`<br>`7.042` |
| runtime | number | `101`<br>`108`<br>`170` |
| tmdbId | number | `324544`<br>`552524`<br>`575265` |
| isActive | boolean | `true`<br>`false`<br>`true` |
| addedByAdmin |  |  |
| theatres | Array, Array<ObjectId> | `[]`<br>`[]`<br>`[]` |
| __v | number | `0`<br>`0`<br>`0` |
| created_at | Date | `"2026-01-26T18:43:59.284Z"`<br>`"2026-01-26T18:43:59.285Z"`<br>`"2026-01-26T18:43:59.285Z"` |
| updated_at | Date | `"2026-01-29T22:32:37.059Z"`<br>`"2026-01-29T18:18:46.703Z"`<br>`"2026-01-29T21:42:05.995Z"` |
| trailer_path | string | `https://www.youtube.com/watch?v=CMyrp5Vk3mU`<br>`https://www.youtube.com/watch?v=VWqJifMMgZE`<br>`https://www.youtube.com/watch?v=OfOS9L0dItk` |
| reviews | Array, Array<string> | `[]`<br>`["https://x.com/mastersmovie/status/2014339769447456840?s=20","https://x.com/VyceVictus/status/19163` |
| excludedTheatres | Array<ObjectId>, Array | `["697b48290c50a205525c3b29"]`<br>`[]` |

### Sample Document
```json
{
  "_id": "6977b5efec98f5d286477f7d",
  "title": "In the Lost Lands",
  "overview": "A queen sends the powerful and feared sorceress Gray Alys to the ghostly wilderness of the Lost Lands in search of a magical power, where she and her guide, the drifter Boyce, must outwit and outfight both man and demon.",
  "poster_path": "https://image.tmdb.org/t/p/original/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg",
  "backdrop_path": "https://image.tmdb.org/t/p/original/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg",
  "release_date": "2025-02-27T00:00:00.000Z",
  "original_language": "hi",
  "tagline": "She seeks the power to free her people.",
  "genres": [
    {
      "id": 28,
      "name": "Action"
    },
    {
      "id": 14,
      "name": "Fantasy"
    },
    {
      "id": 12,
      "name": "Adventure"
    }
  ],
  "casts": [
    {
      "name": "Milla Jovovich",
      "profile_path": "https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0qfM00y.jpg"
    },
    {
      "name": "Dave Bautista",
      "profile_path": "https://image.tmdb.org/t/p/original/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg"
    },
    {
      "name": "Arly Jover",
      "profile_path": "https://image.tmdb.org/t/p/original/zmznPrQ9GSZwcOIUT0c3GyETwrP.jpg"
    },
    {
      "name": "Amara Okereke",
      "profile_path": "https://image.tmdb.org/t/p/original/nTSPtzWu6deZTJtWXHUpACVznY4.jpg"
    },
    {
      "name": "Fraser James",
      "profile_path": "https://image.tmdb.org/t/p/original/mGAPQG2OKTgdKFkp9YpvCSqcbgY.jpg"
    },
    {
      "name": "Deirdre Mullins",
      "profile_path": "https://image.tmdb.org/t/p/original/lJm89neuiVlYISEqNpGZA5kTAnP.jpg"
    },
    {
      "name": "Sebastian Stankiewicz",
      "profile_path": "https://image.tmdb.org/t/p/original/hLN0Ca09KwQOFLZLPIEzgTIbqqg.jpg"
    },
    {
      "name": "Tue Lunding",
      "profile_path": "https://image.tmdb.org/t/p/original/qY4W0zfGBYzlCyCC0QDJS1Muoa0.jpg"
    },
    {
      "name": "Jacek Dzisiewicz",
      "profile_path": "https://image.tmdb.org/t/p/original/6Ksb8ANhhoWWGnlM6O1qrySd7e1.jpg"
    },
    {
      "name": "Ian Hanmore",
      "profile_path": "https://image.tmdb.org/t/p/original/yhI4MK5atavKBD9wiJtaO1say1p.jpg"
    },
    {
      "name": "Eveline Hall",
      "profile_path": "https://image.tmdb.org/t/p/original/uPq4xUPiJIMW5rXF9AT0GrRqgJY.jpg"
    },
    {
      "name": "Kamila Klamut",
      "profile_path": "https://image.tmdb.org/t/p/original/usWnHCzbADijULREZYSJ0qfM00y.jpg"
    },
    {
      "name": "Caoilinn Springall",
      "profile_path": "https://image.tmdb.org/t/p/original/uZNtbPHowlBYo74U1qlTaRlrdiY.jpg"
    },
    {
      "name": "Jan Kowalewski",
      "profile_path": "https://image.tmdb.org/t/p/original/snk6JiXOOoRjPtHU5VMoy6qbd32.jpg"
    },
    {
      "name": "Pawel Wysocki",
      "profile_path": "https://image.tmdb.org/t/p/original/zmznPrQ9GSZwcOIUT0c3GyETwrP.jpg"
    },
    {
      "name": "Simon Lööf",
      "profile_path": "https://image.tmdb.org/t/p/original/cbZrB8crWlLEDjVUoak8Liak6s.jpg"
    },
    {
      "name": "Tomasz Cymerman",
      "profile_path": "https://image.tmdb.org/t/p/original/nTSPtzWu6deZTJtWXHUpACVznY4.jpg"
    }
  ],
  "vote_average": 6.4,
  "runtime": 101,
  "tmdbId": 324544,
  "isActive": true,
  "addedByAdmin": null,
  "theatres": [],
  "__v": 0,
  "created_at": "2026-01-26T18:43:59.284Z",
  "updated_at": "2026-01-29T22:32:37.059Z",
  "trailer_path": "https://www.youtube.com/watch?v=CMyrp5Vk3mU",
  "reviews": []
}
```

---

## seat_categories

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 1

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## seats

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| screen_id_1 | `{"screen_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## screen_tbl

### Statistics
- **Document Count**: 25
- **Size**: 0.042 MB
- **Indexes**: 4

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| theatre_1_isActive_1 | `{"theatre":1,"isActive":1}` |
| theatre_1_status_1 | `{"theatre":1,"status":1}` |
| name_1_theatre_1 | `{"name":1,"theatre":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"697ba0e65643af4f9e0aa59b"`<br>`"697ba0e65643af4f9e0aa5a0"`<br>`"697ba0e65643af4f9e0aa5a6"` |
| name | string | `A`<br>`Screen 1`<br>`Screen 1` |
| screenNumber | string | `1`<br>`1`<br>`1` |
| theatre | ObjectId | `"697881c059df6e8b6b69e8d1"`<br>`"6979b3cd5df669eaf385389d"`<br>`"697b48290c50a205525c3b29"` |
| seatLayout | Object | `{"layout":[["R","R","R","R","R","R"],["R","R","R","R","R","R"],["R","R","R","R","R","R"],["R","R","R`<br>`{"layout":[["S","S","S","S","S","S","S","S","S","S","S","S","S","S"],["S","S","S","S","S","S","S","S`<br>`{"layout":[["S","S","S","S","S","S","S","S"],["S","S","S","S","S","S","S","S"],["S","S","S","S","S",` |
| seatTiers | Array<Object>, Array | `[{"tierName":"Recliner","price":350,"rows":["A","B","C","D","E","F","G","H"],"seatsPerRow":6,"_id":"`<br>`[]`<br>`[]` |
| isActive | boolean | `true`<br>`true`<br>`true` |
| status | string | `active`<br>`active`<br>`active` |
| createdBy | ObjectId | `"697881c059df6e8b6b69e8cf"`<br>`"6979b3cd5df669eaf385389b"`<br>`"697b48290c50a205525c3b27"` |
| lastModifiedBy | ObjectId | `"697881c059df6e8b6b69e8cf"`<br>`"6979b3cd5df669eaf385389b"`<br>`"697b48290c50a205525c3b27"` |
| created_at | Date | `"2026-01-29T18:03:18.489Z"`<br>`"2026-01-29T18:03:18.554Z"`<br>`"2026-01-29T18:03:18.671Z"` |
| updated_at | Date | `"2026-02-19T02:56:13.568Z"`<br>`"2026-01-29T18:03:18.554Z"`<br>`"2026-01-29T18:03:18.671Z"` |
| __v | number | `3`<br>`0`<br>`0` |

### Sample Document
```json
{
  "_id": "697ba0e65643af4f9e0aa59b",
  "name": "A",
  "screenNumber": "1",
  "theatre": "697881c059df6e8b6b69e8d1",
  "seatLayout": {
    "layout": [
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ],
      [
        "R",
        "R",
        "R",
        "R",
        "R",
        "R"
      ]
    ],
    "rows": 8,
    "seatsPerRow": 6,
    "totalSeats": 48
  },
  "seatTiers": [
    {
      "tierName": "Recliner",
      "price": 350,
      "rows": [
        "A",
        "B",
        "C",
        "D",
        "E",
        "F",
        "G",
        "H"
      ],
      "seatsPerRow": 6,
      "_id": "69967bcd6328d36547d220d9"
    }
  ],
  "isActive": true,
  "status": "active",
  "createdBy": "697881c059df6e8b6b69e8cf",
  "lastModifiedBy": "697881c059df6e8b6b69e8cf",
  "created_at": "2026-01-29T18:03:18.489Z",
  "updated_at": "2026-02-19T02:56:13.568Z",
  "__v": 3
}
```

---

## movies_new

### Statistics
- **Document Count**: 8
- **Size**: 0.007 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| title_1 | `{"title":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"699ddbdba9cf05d990ea2f54"`<br>`"699ddbdca9cf05d990ea2f6d"`<br>`"699ddbdda9cf05d990ea2f89"` |
| title | string | `In the Lost Lands`<br>`Until Dawn`<br>`Lilo & Stitch` |
| genre_ids | Array<ObjectId> | `["699ddbd9a9cf05d990ea2ee7","699ddbdaa9cf05d990ea2f1d","699ddbd9a9cf05d990ea2efc"]`<br>`["699ddbd9a9cf05d990ea2ef6","699ddbdba9cf05d990ea2f59"]`<br>`["699ddbdca9cf05d990ea2f71","699ddbd9a9cf05d990ea2eed","699ddbdca9cf05d990ea2f75"]` |
| language_id | Array<ObjectId> | `["699ddbd9a9cf05d990ea2f02"]`<br>`["699ddbd9a9cf05d990ea2eff"]`<br>`["699ddbd9a9cf05d990ea2eff"]` |
| duration_min | number | `101`<br>`103`<br>`108` |
| release_date | Date | `"2025-02-27T00:00:00.000Z"`<br>`"2025-04-23T00:00:00.000Z"`<br>`"2025-05-17T00:00:00.000Z"` |
| description | string | `A queen sends the powerful and feared sorceress Gray Alys to the ghostly wilderness of the Lost Land`<br>`One year after her sister Melanie mysteriously disappeared, Clover and her friends head into the rem`<br>`The wildly funny and touching story of a lonely Hawaiian girl and the fugitive alien who helps to me` |
| poster_path | string | `https://image.tmdb.org/t/p/original/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg`<br>`https://image.tmdb.org/t/p/original/juA4IWO52Fecx8lhAsxmDgy3M3.jpg`<br>`https://image.tmdb.org/t/p/original/mKKqV23MQ0uakJS8OCE2TfV5jNS.jpg` |
| backdrop_path | string | `https://image.tmdb.org/t/p/original/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg`<br>`https://image.tmdb.org/t/p/original/icFWIk1KfkWLZnugZAJEDauNZ94.jpg`<br>`https://image.tmdb.org/t/p/original/7Zx3wDG5bBtcfk8lcnCWDOLM4Y4.jpg` |
| trailer_link | string | `https://www.youtube.com/watch?v=CMyrp5Vk3mU`<br>`https://www.youtube.com/watch?v=2b3vBaINZ7w`<br>`https://www.youtube.com/watch?v=VWqJifMMgZE` |
| cast | Array<ObjectId> | `["699ddbdaa9cf05d990ea2f22","699ddbdaa9cf05d990ea2f25","699ddbdaa9cf05d990ea2f28","699ddbdaa9cf05d99`<br>`["699ddbdaa9cf05d990ea2f22","699ddbdaa9cf05d990ea2f25","699ddbdaa9cf05d990ea2f28","699ddbdaa9cf05d99`<br>`["699ddbdaa9cf05d990ea2f22","699ddbdaa9cf05d990ea2f25","699ddbdaa9cf05d990ea2f28","699ddbdaa9cf05d99` |
| isDeleted | boolean | `false`<br>`false`<br>`true` |
| createdAt | Date | `"2026-02-24T17:11:55.562Z"`<br>`"2026-02-24T17:11:56.266Z"`<br>`"2026-02-24T17:11:57.165Z"` |
| updatedAt | Date | `"2026-02-26T17:56:31.718Z"`<br>`"2026-02-27T17:38:38.610Z"`<br>`"2026-02-24T17:11:57.165Z"` |
| __v | number | `0`<br>`0`<br>`0` |

### Sample Document
```json
{
  "_id": "699ddbdba9cf05d990ea2f54",
  "title": "In the Lost Lands",
  "genre_ids": [
    "699ddbd9a9cf05d990ea2ee7",
    "699ddbdaa9cf05d990ea2f1d",
    "699ddbd9a9cf05d990ea2efc"
  ],
  "language_id": [
    "699ddbd9a9cf05d990ea2f02"
  ],
  "duration_min": 101,
  "release_date": "2025-02-27T00:00:00.000Z",
  "description": "A queen sends the powerful and feared sorceress Gray Alys to the ghostly wilderness of the Lost Lands in search of a magical power, where she and her guide, the drifter Boyce, must outwit and outfight both man and demon.",
  "poster_path": "https://image.tmdb.org/t/p/original/dDlfjR7gllmr8HTeN6rfrYhTdwX.jpg",
  "backdrop_path": "https://image.tmdb.org/t/p/original/op3qmNhvwEvyT7UFyPbIfQmKriB.jpg",
  "trailer_link": "https://www.youtube.com/watch?v=CMyrp5Vk3mU",
  "cast": [
    "699ddbdaa9cf05d990ea2f22",
    "699ddbdaa9cf05d990ea2f25",
    "699ddbdaa9cf05d990ea2f28",
    "699ddbdaa9cf05d990ea2f2b",
    "699ddbdaa9cf05d990ea2f2e",
    "699ddbdaa9cf05d990ea2f31",
    "699ddbdaa9cf05d990ea2f34",
    "699ddbdaa9cf05d990ea2f37",
    "699ddbdba9cf05d990ea2f3a",
    "699ddbdba9cf05d990ea2f3d",
    "699ddbdba9cf05d990ea2f40",
    "699ddbdba9cf05d990ea2f43",
    "699ddbdba9cf05d990ea2f46",
    "699ddbdba9cf05d990ea2f49",
    "699ddbdba9cf05d990ea2f4c",
    "699ddbdba9cf05d990ea2f4f",
    "699ddbdba9cf05d990ea2f52"
  ],
  "isDeleted": false,
  "createdAt": "2026-02-24T17:11:55.562Z",
  "updatedAt": "2026-02-26T17:56:31.718Z",
  "__v": 0
}
```

---

## otp_tbls

### Statistics
- **Document Count**: 8
- **Size**: 0.002 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| email_1 | `{"email":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"697657e24169169a357ea4eb"`<br>`"697b75c10a80a0e5993115cf"`<br>`"697b79b3a3ccf08be0cd84da"` |
| email | string | `piyushbhagchandani.64@gmail.com`<br>`govind@gmail.com`<br>`test1769699763420@example.com` |
| otpHash | string | `$2b$10$HRAjig.Kn.u4M6Wfrvpt.uppxW73PV64ZDY.rTQOQC6HemEJe6vGe`<br>`$2b$10$oa8AEsnQ1sk1BjR5ej/aF.xN6O7iUGnqPnrDDtnA5KqI7Yb6sf4.a`<br>`$2b$10$97Bta6rmya2ePNHx/2aq4Onv45/MPWRJ9gons6gbpyfPvfqUTqm2W` |
| purpose | string | `forgot`<br>`theatre-registration`<br>`forgot` |
| expiresAt | Date | `"2026-01-25T17:52:26.769Z"`<br>`"2026-01-29T15:01:13.989Z"`<br>`"2026-01-29T15:18:03.788Z"` |
| createdAt | Date | `"2026-01-25T17:50:26.772Z"`<br>`"2026-01-29T14:59:13.993Z"`<br>`"2026-01-29T15:16:03.789Z"` |
| updatedAt | Date | `"2026-01-25T17:50:26.772Z"`<br>`"2026-01-29T14:59:13.993Z"`<br>`"2026-01-29T15:16:03.789Z"` |
| __v | number | `0`<br>`0`<br>`0` |

### Sample Document
```json
{
  "_id": "697657e24169169a357ea4eb",
  "email": "piyushbhagchandani.64@gmail.com",
  "otpHash": "$2b$10$HRAjig.Kn.u4M6Wfrvpt.uppxW73PV64ZDY.rTQOQC6HemEJe6vGe",
  "purpose": "forgot",
  "expiresAt": "2026-01-25T17:52:26.769Z",
  "createdAt": "2026-01-25T17:50:26.772Z",
  "updatedAt": "2026-01-25T17:50:26.772Z",
  "__v": 0
}
```

---

## bookings

### Statistics
- **Document Count**: 14
- **Size**: 0.005 MB
- **Indexes**: 3

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| user_id_1_createdAt_-1 | `{"user_id":1,"createdAt":-1}` |
| show_id_1 | `{"show_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"6956ac07d9ff9d140ee8d269"`<br>`"6956acded9ff9d140ee8d287"`<br>`"6956b27e335b56e42207cac5"` |
| user | string | `user_37RAMWQos4GCJzuSv1cDwoxc6eA`<br>`user_37RAMWQos4GCJzuSv1cDwoxc6eA`<br>`user_37RAMWQos4GCJzuSv1cDwoxc6eA` |
| show | string | `6956ab92d9ff9d140ee8d256`<br>`6956ab92d9ff9d140ee8d256`<br>`6956b1c7327f44f10f7b4d14` |
| amount | number | `4646`<br>`4646`<br>`1200` |
| bookedSeats | Array<string>, Array<Object> | `["D2","D3"]`<br>`["D7","D8"]`<br>`["H9","J1","H8","J2"]` |
| isPaid | boolean | `true`<br>`true`<br>`false` |
| createdAt | Date | `"2026-01-01T17:16:55.584Z"`<br>`"2026-01-01T17:20:30.666Z"`<br>`"2026-01-01T17:44:30.440Z"` |
| updatedAt | Date | `"2026-01-01T17:17:22.494Z"`<br>`"2026-01-01T17:21:11.284Z"`<br>`"2026-01-01T17:44:30.440Z"` |
| __v | number | `0`<br>`0`<br>`0` |
| paymentLink | string | ``<br>``<br>`` |
| paymentSessionId | string | `cs_test_a1u8WVEfZX6i8kUX9ad3dv44cZebVKqL2o8MTQQ2fRMC5Dh7FcKGV0177D`<br>`cs_test_a1jgfUiJWBh5J0AETFMqQGRPC9vkh0tbAoexvYeSHVcGnp3jojl6jcB9CS` |
| theatre | ObjectId | `"697b48290c50a205525c3b29"` |
| screen | ObjectId | `"697b50044a5f9c18ce72bd02"` |
| paymentMode | string | `stripe` |
| receiptUrl | string | `https://pay.stripe.com/receipts/payment/CAcaFwoVYWNjdF8xU2s2SXZTcDdMalpKT08xKKmU78sGMgaKRdLVIz06LBYR` |
| paymentIntentId | string | `cs_test_a1DuBCrJFbVRRQG6IDX5EOafyolPrL2nTkt2cYO67L6GbZyz9OnlNP9itZ` |

### Sample Document
```json
{
  "_id": "6956ac07d9ff9d140ee8d269",
  "user": "user_37RAMWQos4GCJzuSv1cDwoxc6eA",
  "show": "6956ab92d9ff9d140ee8d256",
  "amount": 4646,
  "bookedSeats": [
    "D2",
    "D3"
  ],
  "isPaid": true,
  "createdAt": "2026-01-01T17:16:55.584Z",
  "updatedAt": "2026-01-01T17:17:22.494Z",
  "__v": 0,
  "paymentLink": "",
  "paymentSessionId": "cs_test_a1u8WVEfZX6i8kUX9ad3dv44cZebVKqL2o8MTQQ2fRMC5Dh7FcKGV0177D"
}
```

---

## payments

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 3

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| transaction_id_1 | `{"transaction_id":1}` |
| booking_id_1 | `{"booking_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## users

### Statistics
- **Document Count**: 0
- **Size**: 0.000 MB
- **Indexes**: 2

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |
| email_1 | `{"email":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|


### Sample Document
```json
{}
```

---

## theatres

### Statistics
- **Document Count**: 7
- **Size**: 0.026 MB
- **Indexes**: 1

### Indexes
| Index Name | Keys |
|------------|------|
| _id_ | `{"_id":1}` |

### Inferred Schema
| Field | Types | Sample Values |
|-------|-------|---------------|
| _id | ObjectId | `"697881c059df6e8b6b69e8d1"`<br>`"6979b3cd5df669eaf385389d"`<br>`"697b48290c50a205525c3b29"` |
| name | string | `PVR INOX 236`<br>`PVR UTSAV`<br>`Cinepolish` |
| location | string | `Dolera city`<br>`pune`<br>`Vastrapur` |
| manager_id | ObjectId | `"697881c059df6e8b6b69e8cf"`<br>`"6979b3cd5df669eaf385389b"`<br>`"697b48290c50a205525c3b27"` |
| contact_no | string | `9012312370`<br>`9090901212`<br>`9123456780` |
| email | string | `pvrinox@gmail.com`<br>`manage@sxca.edu.in`<br>`cinepolish@gmail.com` |
| address | string | `dolera smart city, new road`<br>`street a`<br>`Alpha Mall, Vastrapur, Ahmedabad` |
| city | string | `ahmedabad`<br>`mumbai`<br>`Ahmedabad` |
| state | string | `gujarat`<br>`maharastra`<br>`Gujurat` |
| zipCode | string | `45671`<br>`12345`<br>`36226` |
| approval_status | string | `approved`<br>`approved`<br>`approved` |
| disabled | boolean | `false`<br>`false`<br>`false` |
| screens | Array<Object> | `[{"name":"A","layout":{"name":"Standard (12x10)","rows":12,"seatsPerRow":10,"totalSeats":120,"layout`<br>`[{"name":"Screen 1","layout":{"name":"Premium (16x14)","rows":16,"seatsPerRow":14,"totalSeats":224,"`<br>`[{"name":"Screen 1","layout":{"name":"Mini (6x8)","rows":6,"seatsPerRow":8,"totalSeats":48,"layout":` |
| createdAt | Date | `"2026-01-27T09:13:36.815Z"`<br>`"2026-01-28T06:59:25.450Z"`<br>`"2026-01-29T11:44:41.735Z"` |
| updatedAt | Date | `"2026-01-29T22:21:41.257Z"`<br>`"2026-01-29T22:21:41.257Z"`<br>`"2026-01-29T22:21:41.257Z"` |
| __v | number | `0`<br>`0`<br>`0` |
| approval_date | Date | `"2026-01-27T09:13:54.784Z"`<br>`"2026-01-28T07:00:18.207Z"`<br>`"2026-01-29T11:45:05.389Z"` |
| disabled_date |  |  |

### Sample Document
```json
{
  "_id": "697881c059df6e8b6b69e8d1",
  "name": "PVR INOX 236",
  "location": "Dolera city",
  "manager_id": "697881c059df6e8b6b69e8cf",
  "contact_no": "9012312370",
  "email": "pvrinox@gmail.com",
  "address": "dolera smart city, new road",
  "city": "ahmedabad",
  "state": "gujarat",
  "zipCode": "45671",
  "approval_status": "approved",
  "disabled": false,
  "screens": [
    {
      "name": "A",
      "layout": {
        "name": "Standard (12x10)",
        "rows": 12,
        "seatsPerRow": 10,
        "totalSeats": 120,
        "layout": [
          [
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S"
          ],
          [
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S"
          ],
          [
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S"
          ],
          [
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S",
            "S"
          ],
          [
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D"
          ],
          [
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D"
          ],
          [
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D"
          ],
          [
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D",
            "D"
          ],
          [
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P"
          ],
          [
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P"
          ],
          [
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P"
          ],
          [
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P",
            "P"
          ]
        ],
        "_id": "697881c059df6e8b6b69e8d3"
      },
      "pricing": {
        "S": {
          "price": 150,
          "enabled": true
        },
        "D": {
          "price": 200,
          "enabled": true
        },
        "P": {
          "price": 250,
          "enabled": true
        }
      },
      "totalSeats": 120,
      "status": "active",
      "_id": "697881c059df6e8b6b69e8d2"
    }
  ],
  "createdAt": "2026-01-27T09:13:36.815Z",
  "updatedAt": "2026-01-29T22:21:41.257Z",
  "__v": 0,
  "approval_date": "2026-01-27T09:13:54.784Z"
}
```

---

## Mongoose Schema Reference

The following schemas are defined in the application:

### 1. User (`users_new`)
```javascript
{
  name: String (required, trimmed),
  email: String (required, unique, lowercase, trimmed),
  phone: String (required, 10-digit validation),
  password_hash: String (required, hidden from queries),
  role: String (enum: ["customer", "manager", "admin"], required),
  last_login: Date,
  isDeleted: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: email, role
```

### 2. Theatre (`theatres`)
```javascript
{
  name: String (required, trimmed),
  location: String (required, trimmed),
  manager_id: ObjectId (ref: "User", required),
  contact_no: String (trimmed),
  email: String (trimmed, lowercase),
  address: String (trimmed),
  city: String (trimmed),
  state: String (trimmed),
  zipCode: String (trimmed),
  step3_pdf_url: String (trimmed),
  approval_status: String (enum: ["pending", "approved", "declined"], default: "pending"),
  approval_date: Date,
  disabled: Boolean (default: false),
  disabled_date: Date,
  isDeleted: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: manager_id, approval_status, location
```

### 3. Movie (`movies_new`)
```javascript
{
  title: String (required, unique, trimmed),
  genre_ids: [ObjectId] (ref: "Genre", required),
  language_id: [ObjectId] (ref: "Language", required),
  duration_min: Number (required, min: 1),
  release_date: Date (required),
  description: String (required, trimmed),
  poster_path: String (trimmed),
  backdrop_path: String (trimmed),
  trailer_link: String (trimmed),
  cast: [ObjectId] (ref: "Cast", required),
  isDeleted: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: title, release_date
```

### 4. Show (`shows_new`)
```javascript
{
  movie: ObjectId (ref: "Movie", required),
  theatre: ObjectId (ref: "Theatre", required),
  screen: ObjectId (ref: "ScreenTbl", required),
  showDateTime: Date (required),
  showTime: String,
  startDate: Date,
  endDate: Date,
  language: String,
  basePrice: Number,
  seatTiers: [{
    tierName: String (required),
    price: Number (required),
    seatsPerRow: Number,
    rowCount: Number,
    totalSeats: Number,
    occupiedSeats: Mixed (default: {})
  }],
  totalCapacity: Number,
  isActive: Boolean (default: true)
}
// Timestamps: createdAt, updatedAt
// Indexes: theatre+showDateTime, movie+showDateTime
```

### 5. Screen (`screens_new`)
```javascript
{
  Tid: ObjectId (ref: "Theatre", required),
  name: String (required, trimmed),
  screenNumber: String (trimmed),
  capacity: Number (required, min: 10),
  seatLayout: {
    layout: [[String]],
    rows: Number,
    seatsPerRow: Number,
    totalSeats: Number
  },
  seatTiers: [{
    tierName: String,
    price: Number,
    rows: [String],
    seatsPerRow: Number
  }],
  isActive: Boolean (default: true),
  isDeleted: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: Tid
```

### 6. ScreenTbl (`screen_tbl`)
```javascript
{
  name: String (required),
  screenNumber: String (required),
  theatre: ObjectId (ref: "Theatre", required),
  seatLayout: {
    layout: [[String]] (required),
    rows: Number (required),
    seatsPerRow: Number (required),
    totalSeats: Number (required)
  },
  seatTiers: [{
    tierName: String (required),
    price: Number (required),
    rows: [String],
    seatsPerRow: Number
  }],
  isActive: Boolean (default: true),
  status: String (enum: ['active', 'inactive', 'maintenance'], default: 'active'),
  createdBy: ObjectId (ref: "User"),
  lastModifiedBy: ObjectId (ref: "User")
}
// Timestamps: created_at, updated_at
// Indexes: theatre+isActive, theatre+status, name+theatre
```

### 7. Booking (`bookings_new`)
```javascript
{
  user_id: ObjectId (ref: "User", required),
  show_id: ObjectId (ref: "Show", required),
  seats_booked: [ObjectId] (ref: "Seat", required),
  total_amount: Number (required, min: 0),
  status: String (enum: ["confirmed", "cancelled", "pending"], default: "pending"),
  payment_link: String (trimmed),
  isPaid: Boolean (default: false)
}
// Timestamps: createdAt, updatedAt
// Indexes: user_id+createdAt, show_id
```

### 8. Payment (`payments`)
```javascript
{
  booking_id: ObjectId (ref: "Booking", required),
  amount: Number (required),
  method: String (enum: ["UPI", "card", "netbanking", "wallet"], required),
  status: String (enum: ["success", "failed", "refunded", "pending"], default: "pending"),
  transaction_id: String (required, unique, trimmed),
  payment_time: Date (required, default: Date.now)
}
// Timestamps: createdAt, updatedAt
// Indexes: booking_id
```

### 9. Seat (`seats`)
```javascript
{
  screen_id: ObjectId (ref: "Screen", required),
  category_id: ObjectId (ref: "SeatCategory", required),
  seat_codes: [String] (required, trimmed)
}
// Timestamps: createdAt, updatedAt
// Indexes: screen_id
```

### 10. SeatCategory (`seat_categories`)
```javascript
{
  name: String (required, trimmed),
  price: Number (required, min: 0),
  description: String (trimmed)
}
// Timestamps: createdAt, updatedAt
```

### 11. Genre (`genres`)
```javascript
{
  name: String (required, unique, trimmed),
  description: String (trimmed)
}
// Timestamps: createdAt, updatedAt
```

### 12. Language (`languages`)
```javascript
{
  name: String (required, unique, trimmed),
  code: String (required, trimmed),
  region: String (trimmed)
}
// Timestamps: createdAt, updatedAt
```

### 13. Cast (`casts`)
```javascript
{
  name: String (required, trimmed),
  bio: String (trimmed),
  dob: Date
}
// Timestamps: createdAt, updatedAt
```

### 14. RatingsReview (`ratings_reviews`)
```javascript
{
  movie_id: ObjectId (ref: "Movie", required),
  user_id: ObjectId (ref: "User", required),
  rating: Number (required, min: 0, max: 5),
  review: String (trimmed)
}
// Timestamps: createdAt, updatedAt
// Indexes: movie_id, user_id
```

### 15. Feedback (`feedbacks`)
```javascript
{
  user: String (required, ref: "User"),
  show: ObjectId (ref: "Show"),
  theatre: ObjectId (ref: "Theatre"),
  rating: Number (required, min: 1, max: 5),
  message: String
}
// Timestamps: createdAt, updatedAt
```

### 16. Otp (`otp_tbls`)
```javascript
{
  email: String (required, indexed, lowercase, trimmed),
  otpHash: String (required),
  purpose: String (enum: ["login", "forgot", "signup", "theatre-registration"], default: "login"),
  expiresAt: Date (required)
}
// Timestamps: createdAt, updatedAt
```

---

## Entity Relationship Diagram

```
User ──┬── manages ──→ Theatre
       │                  │
       │                  ├── has ──→ Screen/ScreenTbl
       │                  │              │
       │                  │              └── has ──→ Seat
       │                  │
       │                  └── hosts ──→ Show ──→ Movie
       │                                    │
       │                                    └── has ──→ Booking
       │                                                   │
       │                                                   └── has ──→ Payment
       │
       ├── writes ──→ RatingsReview ──→ Movie
       │
       └── sends ──→ Feedback

Movie ──┬── belongs to ──→ Genre
        ├── in ──→ Language
        └── features ──→ Cast
```

---

*Generated by fetchAllTables.js script*
