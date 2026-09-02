(async () => {
  try {
    const url = 'https://script.google.com/macros/s/AKfycbx2qEmfvfdvcsI0Qi7UJeAAC80kOHeJw4gHrW1acUYwZxekpj3n555XQJDx2qGEVcg/exec';
    const payload = { accion: 'LISTAR_CASOS' };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    console.log('STATUS:', res.status);
    const text = await res.text();
    console.log('BODY LENGTH:', text.length);
    console.log('BODY:', text.substring(0, 1000));
  } catch (err) {
    console.error(err);
  }
})();
