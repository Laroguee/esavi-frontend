export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function login(email: string, passwordPlain: string) {
  const hashedPassword = await hashPassword(passwordPlain);
  
  const payload = {
    accion: 'LOGIN',
    email,
    password: hashedPassword
  };

  try {
    const response = await fetch(import.meta.env.VITE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    
    const text = await response.text();
    const result = JSON.parse(text);
    return result;
  } catch (error) {
    console.error("Error en login:", error);
    return { success: false, error: "Error de conexión con el servidor" };
  }
}
