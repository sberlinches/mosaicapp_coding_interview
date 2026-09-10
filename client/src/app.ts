export async function fetchGreeting(): Promise<string> {
  const baseUrl = import.meta.env.VITE_API_URL;
  const response = await fetch(`${baseUrl}/`);
  return response.text();
}
