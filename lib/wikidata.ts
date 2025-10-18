// Tipos para las preguntas y respuestas
export type WikidataQuestion = {
  question: string
  options: string[]
  correctAnswer: string
  id?: string // Identificador opcional para evitar repeticiones
  image?: string // URL opcional de imagen desde Wikimedia Commons
}

// Función principal para obtener una pregunta aleatoria de Wikidata
export async function getRandomQuestion(level: number): Promise<WikidataQuestion> {
  // Determinar la dificultad basada en el nivel
  const difficulty = level < 5 ? "easy" : level < 10 ? "medium" : "hard"

  try {
    // Intentar obtener una pregunta real de Wikidata
    const question = await generateWikidataQuestion(difficulty)
    return question
  } catch (error) {
    console.error("Error fetching question from Wikidata:", error)
    // En caso de error, usar preguntas de respaldo
    return getBackupQuestion(difficulty)
  }
}

// Función para realizar consultas a Wikidata con reintentos y mejor manejo de errores
async function fetchFromWikidata(sparqlQuery: string, retries = 2) {
  const endpoint = "https://query.wikidata.org/sparql"
  const url = `${endpoint}?query=${encodeURIComponent(sparqlQuery)}&format=json`

  let lastError: Error | null = null

  // Implementar reintentos
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      // Añadir un pequeño retraso entre reintentos para no sobrecargar el servidor
      if (attempt > 0) {
        await new Promise((resolve) => setTimeout(resolve, 500 * attempt))
      }

      const response = await fetch(url, {
        headers: {
          Accept: "application/sparql-results+json",
          "User-Agent": "WikiMillionaire/1.0 (educational game)",
        },
        // Añadir un timeout para evitar esperas infinitas
        signal: AbortSignal.timeout(10000), // 10 segundos de timeout
      })

      if (!response.ok) {
        throw new Error(`Wikidata API error: ${response.status}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`Attempt ${attempt + 1}/${retries + 1} failed:`, error)
      lastError = error instanceof Error ? error : new Error(String(error))

      // Si es el último intento, lanzar el error
      if (attempt === retries) {
        throw lastError
      }
    }
  }

  // Este código no debería ejecutarse nunca, pero TypeScript lo necesita
  throw lastError || new Error("Unknown error in fetchFromWikidata")
}

// Función para generar una pregunta basada en datos de Wikidata
async function generateWikidataQuestion(difficulty: string): Promise<WikidataQuestion> {
  // Seleccionar un tipo de pregunta aleatoriamente según la dificultad
  const questionTypes = getQuestionTypesByDifficulty(difficulty)
  const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)]

  // Intentar generar la pregunta según el tipo seleccionado
  try {
    switch (randomType) {
      case "capital":
        return await generateCapitalQuestion()
      case "birthdate":
        return await generateBirthdateQuestion()
      case "population":
        return await generatePopulationQuestion(difficulty)
      case "area":
        return await generateAreaQuestion()
      case "invention":
        return await generateInventionQuestion()
      case "element":
        return await generateElementQuestion()
      case "author":
        return await generateAuthorQuestion()
      case "mountain":
        return await generateMountainQuestion()
      case "flag":
        return await generateFlagQuestion()
      case "artwork":
        return await generateArtworkQuestion()
      case "landmark":
        return await generateLandmarkQuestion()
      default:
        return await generateCapitalQuestion() // Por defecto, pregunta sobre capitales
    }
  } catch (error) {
    console.error(`Error generating ${randomType} question:`, error)

    // Si falla un tipo específico, intentar con otro tipo
    const remainingTypes = questionTypes.filter((type) => type !== randomType)

    if (remainingTypes.length > 0) {
      const fallbackType = remainingTypes[Math.floor(Math.random() * remainingTypes.length)]

      // Intentar con un tipo alternativo
      switch (fallbackType) {
        case "capital":
          return await generateCapitalQuestion()
        case "population":
          return await generatePopulationQuestion()
        case "element":
          return await generateElementQuestion()
        default:
          // Si todo falla, usar una pregunta de respaldo
          throw new Error("All question types failed")
      }
    }

    // Si no hay más tipos para intentar, lanzar el error original
    throw error
  }
}

// Función para obtener tipos de preguntas según dificultad
function getQuestionTypesByDifficulty(difficulty: string): string[] {
  switch (difficulty) {
    case "easy":
      return ["capital", "author", "element", "flag", "artwork"]
    case "medium":
      return ["area", "mountain", "invention", "birthdate", "landmark"]
    case "hard":
      return ["population", "invention", "mountain", "element"]
    default:
      return ["capital"]
  }
}

// Función para generar una pregunta sobre capitales de países
async function generateCapitalQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?country ?countryLabel ?capital ?capitalLabel WHERE {
      ?country wdt:P31 wd:Q6256 .      # Instancia de país
      ?country wdt:P36 ?capital .      # Capital
      
      # Filtrar para obtener solo países importantes
      ?country wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 50)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 15
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre capitales")
  }

  // Seleccionar un país aleatorio para la pregunta
  const randomIndex = Math.floor(Math.random() * Math.min(results.length, 10))
  const selectedCountry = results[randomIndex]

  // Crear la pregunta
  const question = `¿Cuál es la capital de ${selectedCountry.countryLabel.value}?`
  const correctAnswer = selectedCountry.capitalLabel.value

  // Generar opciones incorrectas (otras capitales)
  const incorrectOptions = results
    .filter((result) => result.capitalLabel.value !== correctAnswer)
    .map((result) => result.capitalLabel.value)
    .slice(0, 3)

  // Mezclar las opciones
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

  return {
    question,
    options,
    correctAnswer,
    id: `capital-${selectedCountry.country.value.split("/").pop()}`,
  }
}

// Función para generar una pregunta sobre fechas de nacimiento de personas famosas
// Esta función estaba causando problemas, la he simplificado significativamente
async function generateBirthdateQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada y optimizada
  const sparqlQuery = `
    SELECT ?person ?personLabel ?birthyear WHERE {
      # Personas famosas con muchos enlaces en Wikipedia
      ?person wdt:P31 wd:Q5 .          # Instancia de ser humano
      ?person wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 100)         # Personas muy conocidas
      
      # Año de nacimiento (más simple que fecha completa)
      ?person p:P569/psv:P569 [wikibase:timeValue ?birthdate; wikibase:timePrecision ?precision] .
      BIND(YEAR(?birthdate) as ?birthyear) .
      FILTER(?precision >= 9)          # Precisión de al menos año
      FILTER(?birthyear > 1700)        # Personas relativamente modernas
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 10
  `

  try {
    const data = await fetchFromWikidata(sparqlQuery)
    const results = data.results.bindings

    if (!results || results.length === 0) {
      throw new Error("No se encontraron datos para la pregunta sobre fechas de nacimiento")
    }

    // Seleccionar una persona aleatoria para la pregunta
    const randomIndex = Math.floor(Math.random() * results.length)
    const selectedPerson = results[randomIndex]

    // Extraer el año de nacimiento
    const birthYear = Number.parseInt(selectedPerson.birthyear.value)

    // Crear la pregunta
    const question = `¿En qué año nació ${selectedPerson.personLabel.value}?`
    const correctAnswer = birthYear.toString()

    // Generar opciones incorrectas (años cercanos pero diferentes)
    const incorrectOptions = [(birthYear - 5).toString(), (birthYear + 5).toString(), (birthYear - 10).toString()]

    // Mezclar las opciones
    const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

    return {
      question,
      options,
      correctAnswer,
      id: `birthdate-${selectedPerson.person.value.split("/").pop()}`,
    }
  } catch (error) {
    console.error("Error in birthdate question:", error)
    throw new Error("Failed to generate birthdate question")
  }
}

// Función para generar una pregunta sobre población de países
async function generatePopulationQuestion(difficulty: string = "hard"): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?country ?countryLabel ?population WHERE {
      ?country wdt:P31 wd:Q6256 .      # Instancia de país
      ?country wdt:P1082 ?population .  # Población
      
      # Filtrar para obtener solo países importantes
      ?country wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 50)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 15
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre población")
  }

  // Seleccionar un país aleatorio para la pregunta
  const randomIndex = Math.floor(Math.random() * Math.min(results.length, 10))
  const selectedCountry = results[randomIndex]

  // Crear la pregunta
  const question = `¿Cuál es aproximadamente la población de ${selectedCountry.countryLabel.value}?`

  // Formatear la población correcta con redondeo basado en dificultad
  const population = Number.parseInt(selectedCountry.population.value)
  const difficultyFactor = difficulty === "easy" ? 10000000 : 1000000
  const roundedPopulation = Math.round(population / difficultyFactor) * difficultyFactor
  const correctAnswer = formatPopulation(roundedPopulation)

  // Generar opciones incorrectas (poblaciones diferentes)
  const incorrectOptions = [
    formatPopulation(roundedPopulation * 0.5),
    formatPopulation(roundedPopulation * 2),
    formatPopulation(roundedPopulation * 0.75),
  ]

  // Mezclar las opciones
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

  return {
    question,
    options,
    correctAnswer,
    id: `population-${selectedCountry.country.value.split("/").pop()}`,
  }
}

// Función para formatear números de población
function formatPopulation(population: number): string {
  if (population >= 1000000) {
    return `${(population / 1000000).toFixed(1)} millones`
  } else if (population >= 1000) {
    return `${(population / 1000).toFixed(1)} mil`
  } else {
    return population.toString()
  }
}

// Función para generar una pregunta sobre área de países
async function generateAreaQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?country ?countryLabel ?area WHERE {
      ?country wdt:P31 wd:Q6256 .      # Instancia de país
      ?country wdt:P2046 ?area .       # Área
      
      # Filtrar para obtener solo países importantes
      ?country wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 50)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 15
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre área")
  }

  // Seleccionar un país aleatorio para la pregunta
  const randomIndex = Math.floor(Math.random() * Math.min(results.length, 10))
  const selectedCountry = results[randomIndex]

  // Crear la pregunta
  const question = `¿Cuál es aproximadamente el área de ${selectedCountry.countryLabel.value}?`

  // Formatear el área correcta (redondeada a miles de km²)
  const area = Number.parseFloat(selectedCountry.area.value)
  const roundedArea = Math.round(area / 1000) * 1000
  const correctAnswer = `${roundedArea.toLocaleString()} km²`

  // Generar opciones incorrectas (áreas diferentes)
  const incorrectOptions = [
    `${Math.round(roundedArea * 0.5).toLocaleString()} km²`,
    `${Math.round(roundedArea * 2).toLocaleString()} km²`,
    `${Math.round(roundedArea * 0.75).toLocaleString()} km²`,
  ]

  // Mezclar las opciones
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

  return {
    question,
    options,
    correctAnswer,
    id: `area-${selectedCountry.country.value.split("/").pop()}`,
  }
}

// Función para generar una pregunta sobre inventores
async function generateInventionQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?invention ?inventionLabel ?inventor ?inventorLabel WHERE {
      ?invention wdt:P31/wdt:P279* wd:Q11019 .  # Instancia o subclase de artefacto tecnológico
      ?invention wdt:P61 ?inventor .           # Inventor
      ?inventor wdt:P31 wd:Q5 .                # Inventor es humano
      
      # Filtrar para obtener solo inventos conocidos
      ?invention wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 20)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 10
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre inventos")
  }

  // Seleccionar un invento aleatorio para la pregunta
  const randomIndex = Math.floor(Math.random() * results.length)
  const selectedInvention = results[randomIndex]

  // Crear la pregunta
  const question = `¿Quién inventó ${selectedInvention.inventionLabel.value}?`
  const correctAnswer = selectedInvention.inventorLabel.value

  // Obtener otros inventores para opciones incorrectas
  const otherInventors = results
    .filter((result) => result.inventorLabel.value !== correctAnswer)
    .map((result) => result.inventorLabel.value)

  // Eliminar duplicados
  const uniqueInventors = [...new Set(otherInventors)]

  // Seleccionar 3 inventores aleatorios para opciones incorrectas
  const incorrectOptions = uniqueInventors.sort(() => Math.random() - 0.5).slice(0, 3)

  // Mezclar las opciones
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

  return {
    question,
    options,
    correctAnswer,
    id: `invention-${selectedInvention.invention.value.split("/").pop()}`,
  }
}

// Función para generar una pregunta sobre elementos químicos
async function generateElementQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?element ?elementLabel ?symbol WHERE {
      ?element wdt:P31 wd:Q11344 .      # Instancia de elemento químico
      ?element wdt:P246 ?symbol .       # Símbolo químico
      
      # Filtrar para obtener solo elementos comunes
      FILTER(STRLEN(?symbol) <= 2)      # Símbolos de 1 o 2 caracteres
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 20
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre elementos químicos")
  }

  // Seleccionar un elemento aleatorio para la pregunta
  const randomIndex = Math.floor(Math.random() * Math.min(results.length, 15))
  const selectedElement = results[randomIndex]

  // Decidir aleatoriamente si preguntar por el símbolo o por el elemento
  const askForSymbol = Math.random() > 0.5

  let question, correctAnswer

  if (askForSymbol) {
    question = `¿Cuál es el símbolo químico del ${selectedElement.elementLabel.value}?`
    correctAnswer = selectedElement.symbol.value

    // Generar opciones incorrectas (otros símbolos)
    const incorrectOptions = results
      .filter((result) => result.symbol.value !== correctAnswer)
      .map((result) => result.symbol.value)
      .slice(0, 3)

    // Mezclar las opciones
    const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

    return {
      question,
      options,
      correctAnswer,
      id: `element-symbol-${selectedElement.element.value.split("/").pop()}`,
    }
  } else {
    question = `¿Qué elemento químico tiene el símbolo "${selectedElement.symbol.value}"?`
    correctAnswer = selectedElement.elementLabel.value

    // Generar opciones incorrectas (otros elementos)
    const incorrectOptions = results
      .filter((result) => result.elementLabel.value !== correctAnswer)
      .map((result) => result.elementLabel.value)
      .slice(0, 3)

    // Mezclar las opciones
    const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

    return {
      question,
      options,
      correctAnswer,
      id: `element-name-${selectedElement.element.value.split("/").pop()}`,
    }
  }
}

// Función para generar una pregunta sobre autores de libros
async function generateAuthorQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?book ?bookLabel ?author ?authorLabel WHERE {
      ?book wdt:P31 wd:Q571 .           # Instancia de libro
      ?book wdt:P50 ?author .           # Autor
      ?author wdt:P31 wd:Q5 .           # Autor es humano
      
      # Filtrar para obtener solo libros conocidos
      ?book wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 30)           # Libros con muchos enlaces (populares)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 10
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre autores")
  }

  // Seleccionar un libro aleatorio para la pregunta
  const randomIndex = Math.floor(Math.random() * results.length)
  const selectedBook = results[randomIndex]

  // Crear la pregunta
  const question = `¿Quién escribió "${selectedBook.bookLabel.value}"?`
  const correctAnswer = selectedBook.authorLabel.value

  // Obtener otros autores para opciones incorrectas
  const otherAuthors = results
    .filter((result) => result.authorLabel.value !== correctAnswer)
    .map((result) => result.authorLabel.value)

  // Eliminar duplicados
  const uniqueAuthors = [...new Set(otherAuthors)]

  // Seleccionar 3 autores aleatorios para opciones incorrectas
  const incorrectOptions = uniqueAuthors.sort(() => Math.random() - 0.5).slice(0, 3)

  // Mezclar las opciones
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

  return {
    question,
    options,
    correctAnswer,
    id: `author-${selectedBook.book.value.split("/").pop()}`,
  }
}

// Función para generar una pregunta sobre montañas
async function generateMountainQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?mountain ?mountainLabel ?elevation ?country ?countryLabel WHERE {
      ?mountain wdt:P31 wd:Q8502 .      # Instancia de montaña
      ?mountain wdt:P2044 ?elevation .   # Elevación sobre el nivel del mar
      ?mountain wdt:P17 ?country .       # País
      
      # Filtrar para obtener solo montañas conocidas
      ?mountain wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 20)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 10
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre montañas")
  }

  // Seleccionar una montaña aleatoria para la pregunta
  const randomIndex = Math.floor(Math.random() * results.length)
  const selectedMountain = results[randomIndex]

  // Decidir aleatoriamente si preguntar por la elevación o por el país
  const askForElevation = Math.random() > 0.5

  let question, correctAnswer

  if (askForElevation) {
    question = `¿Cuál es aproximadamente la altura del ${selectedMountain.mountainLabel.value}?`
    const elevation = Math.round(Number.parseFloat(selectedMountain.elevation.value))
    correctAnswer = `${elevation.toLocaleString()} metros`

    // Generar opciones incorrectas (otras elevaciones)
    const incorrectOptions = [
      `${Math.round(elevation * 0.8).toLocaleString()} metros`,
      `${Math.round(elevation * 1.2).toLocaleString()} metros`,
      `${Math.round(elevation * 0.6).toLocaleString()} metros`,
    ]

    // Mezclar las opciones
    const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

    return {
      question,
      options,
      correctAnswer,
      id: `mountain-elevation-${selectedMountain.mountain.value.split("/").pop()}`,
    }
  } else {
    question = `¿En qué país se encuentra el ${selectedMountain.mountainLabel.value}?`
    correctAnswer = selectedMountain.countryLabel.value

    // Obtener otros países para opciones incorrectas
    const otherCountries = results
      .filter((result) => result.countryLabel.value !== correctAnswer)
      .map((result) => result.countryLabel.value)

    // Eliminar duplicados
    const uniqueCountries = [...new Set(otherCountries)]

    // Seleccionar 3 países aleatorios para opciones incorrectas
    const incorrectOptions = uniqueCountries.sort(() => Math.random() - 0.5).slice(0, 3)

    // Mezclar las opciones
    const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

    return {
      question,
      options,
      correctAnswer,
      id: `mountain-country-${selectedMountain.mountain.value.split("/").pop()}`,
    }
  }
}

// Función para generar una pregunta sobre banderas de países
async function generateFlagQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?country ?countryLabel ?flag WHERE {
      ?country wdt:P31 wd:Q6256 .      # Instancia de país
      ?country wdt:P41 ?flag .         # Imagen de bandera
      
      # Filtrar para obtener solo países importantes
      ?country wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 50)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 15
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre banderas")
  }

  // Seleccionar un país aleatorio para la pregunta
  const randomIndex = Math.floor(Math.random() * Math.min(results.length, 10))
  const selectedCountry = results[randomIndex]

  // Crear la pregunta
  const question = "¿A qué país pertenece esta bandera?"
  const correctAnswer = selectedCountry.countryLabel.value

  // Obtener el nombre de archivo de la imagen
  const flagFileName = selectedCountry.flag.value
  const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(flagFileName)}`

  // Generar opciones incorrectas (otros países)
  const incorrectOptions = results
    .filter((result) => result.countryLabel.value !== correctAnswer)
    .map((result) => result.countryLabel.value)
    .slice(0, 3)

  // Mezclar las opciones
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

  return {
    question,
    options,
    correctAnswer,
    image: imageUrl,
    id: `flag-${selectedCountry.country.value.split("/").pop()}`,
  }
}

// Función para generar una pregunta sobre obras de arte
async function generateArtworkQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?artwork ?artworkLabel ?creator ?creatorLabel ?image WHERE {
      ?artwork wdt:P31 wd:Q3305213 .   # Instancia de pintura
      ?artwork wdt:P170 ?creator .     # Creador
      ?artwork wdt:P18 ?image .        # Imagen
      ?creator wdt:P31 wd:Q5 .         # Creador es humano
      
      # Filtrar para obtener solo obras conocidas
      ?artwork wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 20)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 10
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre obras de arte")
  }

  // Seleccionar una obra aleatoria para la pregunta
  const randomIndex = Math.floor(Math.random() * results.length)
  const selectedArtwork = results[randomIndex]

  // Crear la pregunta
  const question = "¿Quién pintó esta obra?"
  const correctAnswer = selectedArtwork.creatorLabel.value

  // Obtener el nombre de archivo de la imagen
  const imageFileName = selectedArtwork.image.value
  const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFileName)}`

  // Obtener otros artistas para opciones incorrectas
  const otherCreators = results
    .filter((result) => result.creatorLabel.value !== correctAnswer)
    .map((result) => result.creatorLabel.value)

  // Eliminar duplicados
  const uniqueCreators = [...new Set(otherCreators)]

  // Seleccionar 3 artistas aleatorios para opciones incorrectas
  const incorrectOptions = uniqueCreators.sort(() => Math.random() - 0.5).slice(0, 3)

  // Mezclar las opciones
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

  return {
    question,
    options,
    correctAnswer,
    image: imageUrl,
    id: `artwork-${selectedArtwork.artwork.value.split("/").pop()}`,
  }
}

// Función para generar una pregunta sobre monumentos/lugares emblemáticos
async function generateLandmarkQuestion(): Promise<WikidataQuestion> {
  // Consulta SPARQL simplificada
  const sparqlQuery = `
    SELECT ?landmark ?landmarkLabel ?country ?countryLabel ?image WHERE {
      # Monumentos, edificios históricos o lugares emblemáticos
      VALUES ?type { wd:Q4989906 wd:Q35112127 wd:Q570116 }
      ?landmark wdt:P31 ?type .
      ?landmark wdt:P17 ?country .     # País
      ?landmark wdt:P18 ?image .       # Imagen
      
      # Filtrar para obtener solo lugares conocidos
      ?landmark wikibase:sitelinks ?sitelinks .
      FILTER(?sitelinks > 30)
      
      SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
    }
    ORDER BY RAND()
    LIMIT 10
  `

  const data = await fetchFromWikidata(sparqlQuery)
  const results = data.results.bindings

  if (!results || results.length === 0) {
    throw new Error("No se encontraron datos para la pregunta sobre monumentos")
  }

  // Seleccionar un monumento aleatorio para la pregunta
  const randomIndex = Math.floor(Math.random() * results.length)
  const selectedLandmark = results[randomIndex]

  // Crear la pregunta
  const question = "¿En qué país se encuentra este lugar?"
  const correctAnswer = selectedLandmark.countryLabel.value

  // Obtener el nombre de archivo de la imagen
  const imageFileName = selectedLandmark.image.value
  const imageUrl = `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(imageFileName)}`

  // Obtener otros países para opciones incorrectas
  const otherCountries = results
    .filter((result) => result.countryLabel.value !== correctAnswer)
    .map((result) => result.countryLabel.value)

  // Eliminar duplicados
  const uniqueCountries = [...new Set(otherCountries)]

  // Seleccionar 3 países aleatorios para opciones incorrectas
  const incorrectOptions = uniqueCountries.sort(() => Math.random() - 0.5).slice(0, 3)

  // Mezclar las opciones
  const options = [correctAnswer, ...incorrectOptions].sort(() => Math.random() - 0.5)

  return {
    question,
    options,
    correctAnswer,
    image: imageUrl,
    id: `landmark-${selectedLandmark.landmark.value.split("/").pop()}`,
  }
}

// Sistema de caché para preguntas generadas
const questionCache: Record<string, WikidataQuestion[]> = {
  easy: [],
  medium: [],
  hard: [],
}

// Función para obtener una pregunta del caché o generarla si no hay
async function getCachedOrGenerateQuestion(difficulty: string): Promise<WikidataQuestion> {
  // Verificar si hay preguntas en caché
  if (questionCache[difficulty] && questionCache[difficulty].length > 0) {
    // Usar una pregunta del caché
    const randomIndex = Math.floor(Math.random() * questionCache[difficulty].length)
    const question = questionCache[difficulty][randomIndex]

    // Eliminar la pregunta usada del caché
    questionCache[difficulty] = [
      ...questionCache[difficulty].slice(0, randomIndex),
      ...questionCache[difficulty].slice(randomIndex + 1),
    ]

    return question
  }

  // Si no hay preguntas en caché, generar una nueva
  return await generateWikidataQuestion(difficulty)
}

// Función para obtener preguntas de respaldo en caso de error
function getBackupQuestion(difficulty: string): WikidataQuestion {
  const questions = {
    easy: [
      {
        question: "¿Cuál es la capital de Francia?",
        options: ["París", "Londres", "Berlín", "Madrid"],
        correctAnswer: "París",
        id: "backup-1",
      },
      {
        question: "¿Quién pintó la Mona Lisa?",
        options: ["Leonardo da Vinci", "Pablo Picasso", "Vincent van Gogh", "Miguel Ángel"],
        correctAnswer: "Leonardo da Vinci",
        id: "backup-2",
      },
      {
        question: "¿En qué año comenzó la Segunda Guerra Mundial?",
        options: ["1939", "1945", "1914", "1918"],
        correctAnswer: "1939",
        id: "backup-3",
      },
      {
        question: "¿Cuál es el río más largo del mundo?",
        options: ["Amazonas", "Nilo", "Misisipi", "Yangtsé"],
        correctAnswer: "Amazonas",
        id: "backup-4",
      },
      {
        question: "¿Cuál es el país más grande del mundo por superficie?",
        options: ["Rusia", "China", "Estados Unidos", "Canadá"],
        correctAnswer: "Rusia",
        id: "backup-5",
      },
    ],
    medium: [
      {
        question: "¿Cuál es el elemento químico con símbolo 'Au'?",
        options: ["Oro", "Plata", "Aluminio", "Argón"],
        correctAnswer: "Oro",
        id: "backup-6",
      },
      {
        question: "¿Qué planeta es conocido como el 'planeta rojo'?",
        options: ["Marte", "Venus", "Júpiter", "Saturno"],
        correctAnswer: "Marte",
        id: "backup-7",
      },
      {
        question: "¿Quién escribió 'Cien años de soledad'?",
        options: ["Gabriel García Márquez", "Mario Vargas Llosa", "Julio Cortázar", "Isabel Allende"],
        correctAnswer: "Gabriel García Márquez",
        id: "backup-8",
      },
      {
        question: "¿En qué año se fundó la ONU?",
        options: ["1945", "1918", "1939", "1955"],
        correctAnswer: "1945",
        id: "backup-9",
      },
      {
        question: "¿Cuál es la montaña más alta del mundo?",
        options: ["Monte Everest", "K2", "Kangchenjunga", "Lhotse"],
        correctAnswer: "Monte Everest",
        id: "backup-10",
      },
    ],
    hard: [
      {
        question: "¿En qué año se descubrió la estructura del ADN?",
        options: ["1953", "1947", "1962", "1971"],
        correctAnswer: "1953",
        id: "backup-11",
      },
      {
        question: "¿Cuál es la partícula subatómica más pesada?",
        options: ["Quark top", "Neutrón", "Protón", "Electrón"],
        correctAnswer: "Quark top",
        id: "backup-12",
      },
      {
        question: "¿Qué científico propuso la teoría de la relatividad general?",
        options: ["Albert Einstein", "Isaac Newton", "Niels Bohr", "Stephen Hawking"],
        correctAnswer: "Albert Einstein",
        id: "backup-13",
      },
      {
        question: "¿Cuál es el compuesto químico con la fórmula H2O2?",
        options: ["Peróxido de hidrógeno", "Agua", "Ácido sulfúrico", "Metano"],
        correctAnswer: "Peróxido de hidrógeno",
        id: "backup-14",
      },
      {
        question: "¿Qué famoso teorema relaciona los lados de un triángulo rectángulo?",
        options: ["Teorema de Pitágoras", "Teorema de Tales", "Teorema de Fermat", "Teorema de Bayes"],
        correctAnswer: "Teorema de Pitágoras",
        id: "backup-15",
      },
    ],
  }

  // Obtener preguntas ya utilizadas del almacenamiento local
  const usedQuestionsJson = localStorage.getItem("wikimillionaire-used-questions")
  const usedQuestions = usedQuestionsJson ? JSON.parse(usedQuestionsJson) : []

  // Seleccionar preguntas disponibles (no utilizadas)
  const categoryQuestions = questions[difficulty as keyof typeof questions]
  const availableQuestions = categoryQuestions.filter((q) => !usedQuestions.includes(q.id))

  // Si no hay preguntas disponibles, reiniciar las preguntas usadas
  if (availableQuestions.length === 0) {
    localStorage.setItem("wikimillionaire-used-questions", JSON.stringify([]))
    return categoryQuestions[Math.floor(Math.random() * categoryQuestions.length)]
  }

  // Seleccionar una pregunta aleatoria de las disponibles
  const randomIndex = Math.floor(Math.random() * availableQuestions.length)
  const selectedQuestion = availableQuestions[randomIndex]

  // Guardar la pregunta como utilizada
  usedQuestions.push(selectedQuestion.id)
  localStorage.setItem("wikimillionaire-used-questions", JSON.stringify(usedQuestions))

  return selectedQuestion
}

// Exportar la función generateWikidataQuestion para que pueda ser usada por el panel de pruebas
export { generateWikidataQuestion }