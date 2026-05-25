import { getVehicles } from '@/utils/supabaseClient';

export default async function sitemap() {
  const baseUrl = 'https://www.amineauto.dz';

  let vehicles = [];
  try {
    vehicles = await getVehicles();
  } catch (error) {
    console.error('Error fetching vehicles for sitemap:', error);
  }

  const vehicleUrls = vehicles.map((vehicle) => ({
    url: `${baseUrl}/inventory/${vehicle.id}`,
    lastModified: new Date(vehicle.created_at || new Date()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/inventaire`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    ...vehicleUrls,
  ];
}
