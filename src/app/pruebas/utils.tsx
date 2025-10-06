const BACKEND_URL = "https://voley-backend-nhyl.onrender.com"

export const initializeTestWithBackend = async (testType: string) => {
  try {
    console.log(`Initializing ${testType} test with backend`)

    const response = await fetch(`${BACKEND_URL}/api/pruebas/iniciar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        tipo_prueba: testType,
        tiempo_inicio: new Date().toISOString(),
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Error al inicializar la prueba")
    }

    console.log("Test initialized successfully:", data)
    return data
  } catch (error) {
    console.error("Error initializing test:", error)
    throw error
  }
}

export const sendCommandToESP = async (espId: number | string, command?: any) => {
  try {
    // Handle both number and string inputs, extract number if needed
    const deviceId = typeof espId === "string" ? espId : `ESP-${espId}`
    console.log(`Sending command to ${deviceId}`)

    const response = await fetch(`${BACKEND_URL}/api/pusher/send-command`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        deviceId: deviceId,
        command: command?.command || "ON",
        channel: `private-device-${deviceId}`,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.message || "Error al enviar comando")
    }

    console.log(`Command sent successfully to ${deviceId}:`, data)
    return data
  } catch (error) {
    console.error(`Error sending command to ${espId}:`, error)
    throw error
  }
}
