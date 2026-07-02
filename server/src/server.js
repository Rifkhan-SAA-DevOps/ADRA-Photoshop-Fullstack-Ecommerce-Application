import app from './app.js';

const port = Number(process.env.PORT || 5000);

app.listen(port, () => {
  console.log(`Photography Shop API running on http://localhost:${port}`);
});

