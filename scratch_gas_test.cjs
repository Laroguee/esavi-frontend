const fetch = require('node-fetch'); // actually, node 18 has fetch built-in
(async () => {
  try {
    const url = 'https://script.google.com/macros/s/AKfycbwXZxvwSffsq6Muy95Q9YJxsl-RYabHW0HtUNy7MNZFS-T7_HzaOON1kehe62mofJoz/exec';
    const payload = { accion: 'LISTAR_CASOS' };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    console.log('STATUS:', res.status);
    console.log('HEADERS:', res.headers.raw());
    const text = await res.text();
    console.log('BODY:', text.substring(0, 500));
  } catch (err) {
    console.error(err);
  }
})();
