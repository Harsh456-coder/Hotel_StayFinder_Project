# StayFinder

A responsive hotel discovery app. It consumes the provided hotel API response shape:

```json
{
  "status": 200,
  "count": 499,
  "returned": 499,
  "message": "Successfully fetched hotel list",
  "data": []
}
```

## Features

- Search hotels by name or city.
- Filter by city, minimum rating, and maximum price.
- Sort by recommendation, price, or rating.
- View hotel photos and details in an accessible modal.
- Responsive layout for desktop, tablet, and mobile.
- Clean folder structure with separate data, services, styles, and utilities.
- API fallback handling so the app stays usable during demos.

## Connect the API

The app is already connected to `src/data/hotels.json`, which contains the provided hotel API response. To switch to a hosted endpoint, update the API URL before `src/app.js` loads in `index.html`:

```html
<script>
  window.STAYFINDER_API_URL = "https://your-api.example.com/hotels";
</script>
```

The app accepts either a raw hotel array or an object with a `data` array.

## Run

Open `index.html` in a browser. No build step is required.
