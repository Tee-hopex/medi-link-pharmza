import { prisma } from '../../lib/prisma'

// Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export async function getNearby(lat: number, lon: number, radiusKm = 10) {
  const facilities = await prisma.facility.findMany({
    where: { latitude: { not: null }, longitude: { not: null }, verified: true },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, inventory: { select: { quantity: true } } } },
    },
  })

  return facilities
    .map((f) => {
      const distance = haversine(lat, lon, f.latitude!, f.longitude!)
      const totalStock = f.user.inventory.reduce((sum, i) => sum + i.quantity, 0)
      const stockLevel =
        totalStock > 100 ? 'high' : totalStock > 30 ? 'medium' : totalStock > 0 ? 'low' : 'out'
      return { ...f, distance: Math.round(distance * 10) / 10, stockLevel }
    })
    .filter((f) => f.distance <= radiusKm)
    .sort((a, b) => a.distance - b.distance)
}

export async function getPharmacy(id: string) {
  const facility = await prisma.facility.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true, firstName: true, lastName: true,
          listings: {
            where: { status: 'ACTIVE' },
            orderBy: { expiryDate: 'asc' },
            take: 20,
          },
        },
      },
    },
  })
  if (!facility) throw new Error('Pharmacy not found')
  return facility
}
