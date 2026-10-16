export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Obsługujemy zarówno adres główny, jak i /flights
    if (url.pathname === '/flights' || url.pathname === '/') {
      const targetUrl = 'https://api.adsb.lol/v2/lat/50.0647/19.9450/250';
      
      try {
        const apiResponse = await fetch(targetUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        const data = await apiResponse.json();
        
        return new Response(JSON.stringify(data), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          }
        });
      } catch (err) {
        return new Response(JSON.stringify({ error: "Failed to fetch from adsb.lol" }), {
          status: 500,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
        });
      }
    }
    
    return new Response("Not Found", { status: 404 });
  }
};
