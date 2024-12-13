

const loadPickupPoints = async () => {
  try {
    const pickupPoints = await getPickupPointsData(); // Await the async function
    console.log('Loaded Pickup Points:', JSON.stringify(pickupPoints, null, 2)); // Log the data
  } catch (error) {
    console.error('Error loading pickup points:', error);
  }
};

loadPickupPoints();
