Deno.serve(async () => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const baseUrl = `https://agramessepark.de/wp-json/tribe/events/v1/events?per_page=50&start_date=${today}&status=publish`;

    const [res1, res2] = await Promise.all([
      fetch(`${baseUrl}&page=1`),
      fetch(`${baseUrl}&page=2`),
    ]);

    const [data1, data2] = await Promise.all([res1.json(), res2.json()]);

    const raw = [
      ...(data1.events || []),
      ...(data2.events || []),
    ];

    // Deduplicate by title (recurring events may appear multiple times per page)
    const seen = new Set();
    const events = raw
      .filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      })
      .map(e => ({
        id: e.id,
        title: e.title,
        description: e.description
          ? e.description.replace(/<[^>]*>/g, '').trim().slice(0, 300)
          : null,
        start_date: e.start_date,
        end_date: e.end_date,
        image_url: e.image?.url || null,
        website_url: e.url || null,
        ticket_url: e.website || null,
      }));

    return Response.json({ events });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});