<?php

namespace WikiMillionaire\Game;

/**
 * Wikidata Question Generator
 * 
 * This class generates trivia questions by querying Wikidata's SPARQL endpoint.
 * It supports multiple question types and difficulty levels.
 */
class Wikidata
{
    private const WIKIDATA_ENDPOINT = 'https://query.wikidata.org/sparql';
    private const USER_AGENT = 'WikiMillionaire/1.0 (educational game)';
    private const TIMEOUT_SECONDS = 10;
    private const MAX_RETRIES = 2;
    
    private string $language;
    private Language $languageService;

    /**
     * Constructor
     * 
     * @param string $language Language code (e.g., 'en', 'es', 'fr')
     */
    public function __construct(string $language = 'en')
    {
        $this->language = $language;
        $this->languageService = new Language();
    }

    /**
     * Get a random question based on difficulty level
     * 
     * @param int $level The current game level (1-15)
     * @return array Question data with question, options, correctAnswer, and optional id/image
     * @throws \Exception If question generation fails
     */
    public function getRandomQuestion(int $level): array
    {
        $difficulty = $this->getDifficultyFromLevel($level);
        
        try {
            return $this->generateWikidataQuestion($difficulty);
        } catch (\Exception $e) {
            error_log("Error fetching question from Wikidata: " . $e->getMessage());
            return $this->getBackupQuestion($difficulty);
        }
    }

    /**
     * Determine difficulty based on level
     */
    private function getDifficultyFromLevel(int $level): string
    {
        if ($level < 5) {
            return 'easy';
        } elseif ($level < 10) {
            return 'medium';
        } else {
            return 'hard';
        }
    }

    /**
     * Fetch data from Wikidata SPARQL endpoint with retry logic
     */
    private function fetchFromWikidata(string $sparqlQuery, int $retries = self::MAX_RETRIES): array
    {
        $url = self::WIKIDATA_ENDPOINT . '?query=' . urlencode($sparqlQuery) . '&format=json';
        
        $lastError = null;
        
        for ($attempt = 0; $attempt <= $retries; $attempt++) {
            try {
                if ($attempt > 0) {
                    usleep(500000 * $attempt); // 0.5s * attempt delay
                }
                
                $context = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => [
                            'Accept: application/sparql-results+json',
                            'User-Agent: ' . self::USER_AGENT
                        ],
                        'timeout' => self::TIMEOUT_SECONDS
                    ]
                ]);
                
                $response = file_get_contents($url, false, $context);
                
                if ($response === false) {
                    $error = error_get_last();
                    throw new \Exception($error['message'] ?? 'Failed to fetch from Wikidata');
                }
                
                $data = json_decode($response, true);
                
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new \Exception('Invalid JSON response from Wikidata');
                }
                
                return $data;
                
            } catch (\Exception $e) {
                error_log("Attempt " . ($attempt + 1) . "/" . ($retries + 1) . " failed: " . $e->getMessage());
                $lastError = $e;
                
                if ($attempt === $retries) {
                    throw $lastError;
                }
            }
        }
        
        throw $lastError ?? new \Exception('Unknown error in fetchFromWikidata');
    }

    /**
     * Generate a question from Wikidata
     */
    private function generateWikidataQuestion(string $difficulty): array
    {
        $questionTypes = $this->getQuestionTypesByDifficulty($difficulty);
        $randomType = $questionTypes[array_rand($questionTypes)];
        
        try {
            return $this->generateQuestionByType($randomType, $difficulty);
        } catch (\Exception $e) {
            error_log("Error generating {$randomType} question: " . $e->getMessage());
            
            // Try a fallback type
            $remainingTypes = array_diff($questionTypes, [$randomType]);
            
            if (count($remainingTypes) > 0) {
                $fallbackType = $remainingTypes[array_rand($remainingTypes)];
                try {
                    return $this->generateQuestionByType($fallbackType, $difficulty);
                } catch (\Exception $fallbackError) {
                    throw new \Exception('All question types failed');
                }
            }
            
            throw $e;
        }
    }

    /**
     * Get question types by difficulty
     */
    private function getQuestionTypesByDifficulty(string $difficulty): array
    {
        switch ($difficulty) {
            case 'easy':
                return ['capital', 'author', 'element', 'flag', 'artwork'];
            case 'medium':
                return ['area', 'mountain', 'invention', 'birthdate', 'landmark'];
            case 'hard':
                return ['population', 'invention', 'mountain', 'element'];
            default:
                return ['capital'];
        }
    }

    /**
     * Generate question by type
     */
    private function generateQuestionByType(string $type, string $difficulty = 'medium'): array
    {
        switch ($type) {
            case 'capital':
                return $this->generateCapitalQuestion();
            case 'birthdate':
                return $this->generateBirthdateQuestion();
            case 'population':
                return $this->generatePopulationQuestion($difficulty);
            case 'area':
                return $this->generateAreaQuestion();
            case 'invention':
                return $this->generateInventionQuestion();
            case 'element':
                return $this->generateElementQuestion();
            case 'author':
                return $this->generateAuthorQuestion();
            case 'mountain':
                return $this->generateMountainQuestion();
            case 'flag':
                return $this->generateFlagQuestion();
            case 'artwork':
                return $this->generateArtworkQuestion();
            case 'landmark':
                return $this->generateLandmarkQuestion();
            default:
                return $this->generateCapitalQuestion();
        }
    }

    /**
     * Generate capital question
     */
    private function generateCapitalQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?country ?countryLabel ?capital ?capitalLabel WHERE {
                ?country wdt:P31 wd:Q6256 .
                ?country wdt:P36 ?capital .
                ?country wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 50)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "' . $this->language . '". }
            }
            ORDER BY RAND()
            LIMIT 15
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for capital question');
        }
        
        // Filter results to ensure all labels exist in the selected language
        $results = $this->filterResultsWithValidLabels($results, ['countryLabel', 'capitalLabel']);
        
        if (empty($results)) {
            throw new \Exception('No data with valid translations for capital question');
        }
        
        $slicedResults = array_values(array_slice($results, 0, min(10, count($results))));
        $randomIndex = array_rand($slicedResults);
        $selectedCountry = $slicedResults[$randomIndex];
        
        $question = $this->languageService->get('q_what_capital', [
            'country' => $selectedCountry['countryLabel']['value']
        ]);
        $correctAnswer = $selectedCountry['capitalLabel']['value'];
        
        $incorrectOptions = array_slice(
            array_filter(
                array_map(fn($r) => $r['capitalLabel']['value'], $results),
                fn($capital) => $capital !== $correctAnswer
            ),
            0,
            3
        );
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'id' => 'capital-' . basename($selectedCountry['country']['value'])
        ];
    }

    /**
     * Generate birthdate question
     */
    private function generateBirthdateQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?person ?personLabel ?birthyear WHERE {
                ?person wdt:P31 wd:Q5 .
                ?person wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 100)
                ?person p:P569/psv:P569 [wikibase:timeValue ?birthdate; wikibase:timePrecision ?precision] .
                BIND(YEAR(?birthdate) as ?birthyear) .
                FILTER(?precision >= 9)
                FILTER(?birthyear > 1700)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 10
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for birthdate question');
        }
        
        $randomIndex = array_rand($results);
        $selectedPerson = $results[$randomIndex];
        
        $birthYear = intval($selectedPerson['birthyear']['value']);
        
        $question = '¿En qué año nació ' . $selectedPerson['personLabel']['value'] . '?';
        $correctAnswer = strval($birthYear);
        
        $incorrectOptions = [
            strval($birthYear - 5),
            strval($birthYear + 5),
            strval($birthYear - 10)
        ];
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'id' => 'birthdate-' . basename($selectedPerson['person']['value'])
        ];
    }

    /**
     * Generate population question
     */
    private function generatePopulationQuestion(string $difficulty = 'hard'): array
    {
        $sparqlQuery = '
            SELECT ?country ?countryLabel ?population WHERE {
                ?country wdt:P31 wd:Q6256 .
                ?country wdt:P1082 ?population .
                ?country wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 50)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 15
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for population question');
        }
        
        $slicedResults = array_values(array_slice($results, 0, min(10, count($results))));
        $randomIndex = array_rand($slicedResults);
        $selectedCountry = $slicedResults[$randomIndex];
        
        $question = '¿Cuál es aproximadamente la población de ' . $selectedCountry['countryLabel']['value'] . '?';
        
        $population = intval($selectedCountry['population']['value']);
        $difficultyFactor = ($difficulty === 'easy') ? 10000000 : 1000000;
        $roundedPopulation = round($population / $difficultyFactor) * $difficultyFactor;
        $correctAnswer = $this->formatPopulation($roundedPopulation);
        
        $incorrectOptions = [
            $this->formatPopulation($roundedPopulation * 0.5),
            $this->formatPopulation($roundedPopulation * 2),
            $this->formatPopulation($roundedPopulation * 0.75)
        ];
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'id' => 'population-' . basename($selectedCountry['country']['value'])
        ];
    }

    /**
     * Format population number
     */
    private function formatPopulation(float $population): string
    {
        if ($population >= 1000000) {
            return number_format($population / 1000000, 1) . ' millones';
        } elseif ($population >= 1000) {
            return number_format($population / 1000, 1) . ' mil';
        } else {
            return strval(intval($population));
        }
    }

    /**
     * Generate area question
     */
    private function generateAreaQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?country ?countryLabel ?area WHERE {
                ?country wdt:P31 wd:Q6256 .
                ?country wdt:P2046 ?area .
                ?country wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 50)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 15
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for area question');
        }
        
        $slicedResults = array_values(array_slice($results, 0, min(10, count($results))));
        $randomIndex = array_rand($slicedResults);
        $selectedCountry = $slicedResults[$randomIndex];
        
        $question = '¿Cuál es aproximadamente el área de ' . $selectedCountry['countryLabel']['value'] . '?';
        
        $area = floatval($selectedCountry['area']['value']);
        $roundedArea = round($area / 1000) * 1000;
        $correctAnswer = number_format($roundedArea, 0, ',', '.') . ' km²';
        
        $incorrectOptions = [
            number_format(round($roundedArea * 0.5), 0, ',', '.') . ' km²',
            number_format(round($roundedArea * 2), 0, ',', '.') . ' km²',
            number_format(round($roundedArea * 0.75), 0, ',', '.') . ' km²'
        ];
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'id' => 'area-' . basename($selectedCountry['country']['value'])
        ];
    }

    /**
     * Generate invention question
     */
    private function generateInventionQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?invention ?inventionLabel ?inventor ?inventorLabel WHERE {
                ?invention wdt:P31/wdt:P279* wd:Q11019 .
                ?invention wdt:P61 ?inventor .
                ?inventor wdt:P31 wd:Q5 .
                ?invention wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 20)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 10
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for invention question');
        }
        
        $randomIndex = array_rand($results);
        $selectedInvention = $results[$randomIndex];
        
        $question = '¿Quién inventó ' . $selectedInvention['inventionLabel']['value'] . '?';
        $correctAnswer = $selectedInvention['inventorLabel']['value'];
        
        $otherInventors = array_filter(
            array_map(fn($r) => $r['inventorLabel']['value'], $results),
            fn($inventor) => $inventor !== $correctAnswer
        );
        
        $uniqueInventors = array_unique($otherInventors);
        shuffle($uniqueInventors);
        $incorrectOptions = array_slice($uniqueInventors, 0, 3);
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'id' => 'invention-' . basename($selectedInvention['invention']['value'])
        ];
    }

    /**
     * Generate element question
     */
    private function generateElementQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?element ?elementLabel ?symbol WHERE {
                ?element wdt:P31 wd:Q11344 .
                ?element wdt:P246 ?symbol .
                FILTER(STRLEN(?symbol) <= 2)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 20
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for element question');
        }
        
        $slicedResults = array_values(array_slice($results, 0, min(15, count($results))));
        $randomIndex = array_rand($slicedResults);
        $selectedElement = $slicedResults[$randomIndex];
        
        $askForSymbol = (rand(0, 1) === 1);
        
        if ($askForSymbol) {
            $question = '¿Cuál es el símbolo químico del ' . $selectedElement['elementLabel']['value'] . '?';
            $correctAnswer = $selectedElement['symbol']['value'];
            
            $incorrectOptions = array_slice(
                array_filter(
                    array_map(fn($r) => $r['symbol']['value'], $results),
                    fn($symbol) => $symbol !== $correctAnswer
                ),
                0,
                3
            );
            
            $options = array_merge([$correctAnswer], $incorrectOptions);
            shuffle($options);
            
            return [
                'question' => $question,
                'options' => $options,
                'correctAnswer' => $correctAnswer,
                'id' => 'element-symbol-' . basename($selectedElement['element']['value'])
            ];
        } else {
            $question = '¿Qué elemento químico tiene el símbolo "' . $selectedElement['symbol']['value'] . '"?';
            $correctAnswer = $selectedElement['elementLabel']['value'];
            
            $incorrectOptions = array_slice(
                array_filter(
                    array_map(fn($r) => $r['elementLabel']['value'], $results),
                    fn($element) => $element !== $correctAnswer
                ),
                0,
                3
            );
            
            $options = array_merge([$correctAnswer], $incorrectOptions);
            shuffle($options);
            
            return [
                'question' => $question,
                'options' => $options,
                'correctAnswer' => $correctAnswer,
                'id' => 'element-name-' . basename($selectedElement['element']['value'])
            ];
        }
    }

    /**
     * Generate author question
     */
    private function generateAuthorQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?book ?bookLabel ?author ?authorLabel WHERE {
                ?book wdt:P31 wd:Q571 .
                ?book wdt:P50 ?author .
                ?author wdt:P31 wd:Q5 .
                ?book wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 30)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 10
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for author question');
        }
        
        $randomIndex = array_rand($results);
        $selectedBook = $results[$randomIndex];
        
        $question = '¿Quién escribió "' . $selectedBook['bookLabel']['value'] . '"?';
        $correctAnswer = $selectedBook['authorLabel']['value'];
        
        $otherAuthors = array_filter(
            array_map(fn($r) => $r['authorLabel']['value'], $results),
            fn($author) => $author !== $correctAnswer
        );
        
        $uniqueAuthors = array_unique($otherAuthors);
        shuffle($uniqueAuthors);
        $incorrectOptions = array_slice($uniqueAuthors, 0, 3);
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'id' => 'author-' . basename($selectedBook['book']['value'])
        ];
    }

    /**
     * Generate mountain question
     */
    private function generateMountainQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?mountain ?mountainLabel ?elevation ?country ?countryLabel WHERE {
                ?mountain wdt:P31 wd:Q8502 .
                ?mountain wdt:P2044 ?elevation .
                ?mountain wdt:P17 ?country .
                ?mountain wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 20)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 10
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for mountain question');
        }
        
        $randomIndex = array_rand($results);
        $selectedMountain = $results[$randomIndex];
        
        $askForElevation = (rand(0, 1) === 1);
        
        if ($askForElevation) {
            $question = '¿Cuál es aproximadamente la altura del ' . $selectedMountain['mountainLabel']['value'] . '?';
            $elevation = round(floatval($selectedMountain['elevation']['value']));
            $correctAnswer = number_format($elevation, 0, ',', '.') . ' metros';
            
            $incorrectOptions = [
                number_format(round($elevation * 0.8), 0, ',', '.') . ' metros',
                number_format(round($elevation * 1.2), 0, ',', '.') . ' metros',
                number_format(round($elevation * 0.6), 0, ',', '.') . ' metros'
            ];
            
            $options = array_merge([$correctAnswer], $incorrectOptions);
            shuffle($options);
            
            return [
                'question' => $question,
                'options' => $options,
                'correctAnswer' => $correctAnswer,
                'id' => 'mountain-elevation-' . basename($selectedMountain['mountain']['value'])
            ];
        } else {
            $question = '¿En qué país se encuentra el ' . $selectedMountain['mountainLabel']['value'] . '?';
            $correctAnswer = $selectedMountain['countryLabel']['value'];
            
            $otherCountries = array_filter(
                array_map(fn($r) => $r['countryLabel']['value'], $results),
                fn($country) => $country !== $correctAnswer
            );
            
            $uniqueCountries = array_unique($otherCountries);
            shuffle($uniqueCountries);
            $incorrectOptions = array_slice($uniqueCountries, 0, 3);
            
            $options = array_merge([$correctAnswer], $incorrectOptions);
            shuffle($options);
            
            return [
                'question' => $question,
                'options' => $options,
                'correctAnswer' => $correctAnswer,
                'id' => 'mountain-country-' . basename($selectedMountain['mountain']['value'])
            ];
        }
    }

    /**
     * Generate flag question
     */
    private function generateFlagQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?country ?countryLabel ?flag WHERE {
                ?country wdt:P31 wd:Q6256 .
                ?country wdt:P41 ?flag .
                ?country wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 50)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 15
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for flag question');
        }
        
        $slicedResults = array_values(array_slice($results, 0, min(10, count($results))));
        $randomIndex = array_rand($slicedResults);
        $selectedCountry = $slicedResults[$randomIndex];
        
        $question = '¿A qué país pertenece esta bandera?';
        $correctAnswer = $selectedCountry['countryLabel']['value'];
        
        $flagFileName = $selectedCountry['flag']['value'];
        $imageUrl = $this->getCommonsImageUrl($flagFileName);
        
        $incorrectOptions = array_slice(
            array_filter(
                array_map(fn($r) => $r['countryLabel']['value'], $results),
                fn($country) => $country !== $correctAnswer
            ),
            0,
            3
        );
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'image' => $imageUrl,
            'id' => 'flag-' . basename($selectedCountry['country']['value'])
        ];
    }

    /**
     * Generate artwork question
     */
    private function generateArtworkQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?artwork ?artworkLabel ?creator ?creatorLabel ?image WHERE {
                ?artwork wdt:P31 wd:Q3305213 .
                ?artwork wdt:P170 ?creator .
                ?artwork wdt:P18 ?image .
                ?creator wdt:P31 wd:Q5 .
                ?artwork wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 20)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 10
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for artwork question');
        }
        
        $randomIndex = array_rand($results);
        $selectedArtwork = $results[$randomIndex];
        
        $question = '¿Quién pintó esta obra?';
        $correctAnswer = $selectedArtwork['creatorLabel']['value'];
        
        $imageFileName = $selectedArtwork['image']['value'];
        $imageUrl = $this->getCommonsImageUrl($imageFileName);
        
        $otherCreators = array_filter(
            array_map(fn($r) => $r['creatorLabel']['value'], $results),
            fn($creator) => $creator !== $correctAnswer
        );
        
        $uniqueCreators = array_unique($otherCreators);
        shuffle($uniqueCreators);
        $incorrectOptions = array_slice($uniqueCreators, 0, 3);
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'image' => $imageUrl,
            'id' => 'artwork-' . basename($selectedArtwork['artwork']['value'])
        ];
    }

    /**
     * Generate landmark question
     */
    private function generateLandmarkQuestion(): array
    {
        $sparqlQuery = '
            SELECT ?landmark ?landmarkLabel ?country ?countryLabel ?image WHERE {
                VALUES ?type { wd:Q4989906 wd:Q35112127 wd:Q570116 }
                ?landmark wdt:P31 ?type .
                ?landmark wdt:P17 ?country .
                ?landmark wdt:P18 ?image .
                ?landmark wikibase:sitelinks ?sitelinks .
                FILTER(?sitelinks > 30)
                SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
            }
            ORDER BY RAND()
            LIMIT 10
        ';
        
        $data = $this->fetchFromWikidata($sparqlQuery);
        $results = $data['results']['bindings'] ?? [];
        
        if (empty($results)) {
            throw new \Exception('No data found for landmark question');
        }
        
        $randomIndex = array_rand($results);
        $selectedLandmark = $results[$randomIndex];
        
        $question = '¿En qué país se encuentra este lugar?';
        $correctAnswer = $selectedLandmark['countryLabel']['value'];
        
        $imageFileName = $selectedLandmark['image']['value'];
        $imageUrl = $this->getCommonsImageUrl($imageFileName);
        
        $otherCountries = array_filter(
            array_map(fn($r) => $r['countryLabel']['value'], $results),
            fn($country) => $country !== $correctAnswer
        );
        
        $uniqueCountries = array_unique($otherCountries);
        shuffle($uniqueCountries);
        $incorrectOptions = array_slice($uniqueCountries, 0, 3);
        
        $options = array_merge([$correctAnswer], $incorrectOptions);
        shuffle($options);
        
        return [
            'question' => $question,
            'options' => $options,
            'correctAnswer' => $correctAnswer,
            'image' => $imageUrl,
            'id' => 'landmark-' . basename($selectedLandmark['landmark']['value'])
        ];
    }

    /**
     * Get Wikimedia Commons image URL
     */
    private function getCommonsImageUrl(string $url): string
    {
        if (strpos($url, 'Special:FilePath') !== false) {
            return $url;
        }
        
        if (strpos($url, 'http://') === 0 || strpos($url, 'https://') === 0) {
            return $url;
        }
        
        return 'https://commons.wikimedia.org/wiki/Special:Redirect/file/' . urlencode($url);
    }

    /**
     * Filter results to ensure all required labels exist in the selected language
     * This prevents questions where answers don't have translations
     * 
     * @param array $results SPARQL query results
     * @param array $requiredLabels List of label fields that must exist
     * @return array Filtered results
     */
    private function filterResultsWithValidLabels(array $results, array $requiredLabels): array
    {
        return array_filter($results, function($result) use ($requiredLabels) {
            foreach ($requiredLabels as $labelField) {
                // Check if the label exists and is not empty
                if (!isset($result[$labelField]['value']) || empty($result[$labelField]['value'])) {
                    return false;
                }
                
                // Check if the label's xml:lang attribute matches the selected language
                // Wikidata returns labels with xml:lang attribute indicating the language
                if (isset($result[$labelField]['xml:lang']) && 
                    $result[$labelField]['xml:lang'] !== $this->language) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Get backup question when Wikidata is unavailable
     */
    private function getBackupQuestion(string $difficulty): array
    {
        $questions = [
            'easy' => [
                [
                    'question' => '¿Cuál es la capital de Francia?',
                    'options' => ['París', 'Londres', 'Berlín', 'Madrid'],
                    'correctAnswer' => 'París',
                    'id' => 'backup-1'
                ],
                [
                    'question' => '¿Quién pintó la Mona Lisa?',
                    'options' => ['Leonardo da Vinci', 'Pablo Picasso', 'Vincent van Gogh', 'Miguel Ángel'],
                    'correctAnswer' => 'Leonardo da Vinci',
                    'id' => 'backup-2'
                ],
                [
                    'question' => '¿En qué año comenzó la Segunda Guerra Mundial?',
                    'options' => ['1939', '1945', '1914', '1918'],
                    'correctAnswer' => '1939',
                    'id' => 'backup-3'
                ],
                [
                    'question' => '¿Cuál es el río más largo del mundo?',
                    'options' => ['Amazonas', 'Nilo', 'Misisipi', 'Yangtsé'],
                    'correctAnswer' => 'Amazonas',
                    'id' => 'backup-4'
                ],
                [
                    'question' => '¿Cuál es el país más grande del mundo por superficie?',
                    'options' => ['Rusia', 'China', 'Estados Unidos', 'Canadá'],
                    'correctAnswer' => 'Rusia',
                    'id' => 'backup-5'
                ]
            ],
            'medium' => [
                [
                    'question' => '¿Cuál es el elemento químico con símbolo \'Au\'?',
                    'options' => ['Oro', 'Plata', 'Aluminio', 'Argón'],
                    'correctAnswer' => 'Oro',
                    'id' => 'backup-6'
                ],
                [
                    'question' => '¿Qué planeta es conocido como el \'planeta rojo\'?',
                    'options' => ['Marte', 'Venus', 'Júpiter', 'Saturno'],
                    'correctAnswer' => 'Marte',
                    'id' => 'backup-7'
                ],
                [
                    'question' => '¿Quién escribió \'Cien años de soledad\'?',
                    'options' => ['Gabriel García Márquez', 'Mario Vargas Llosa', 'Julio Cortázar', 'Isabel Allende'],
                    'correctAnswer' => 'Gabriel García Márquez',
                    'id' => 'backup-8'
                ],
                [
                    'question' => '¿En qué año se fundó la ONU?',
                    'options' => ['1945', '1918', '1939', '1955'],
                    'correctAnswer' => '1945',
                    'id' => 'backup-9'
                ],
                [
                    'question' => '¿Cuál es la montaña más alta del mundo?',
                    'options' => ['Monte Everest', 'K2', 'Kangchenjunga', 'Lhotse'],
                    'correctAnswer' => 'Monte Everest',
                    'id' => 'backup-10'
                ]
            ],
            'hard' => [
                [
                    'question' => '¿En qué año se descubrió la estructura del ADN?',
                    'options' => ['1953', '1947', '1962', '1971'],
                    'correctAnswer' => '1953',
                    'id' => 'backup-11'
                ],
                [
                    'question' => '¿Cuál es la partícula subatómica más pesada?',
                    'options' => ['Quark top', 'Neutrón', 'Protón', 'Electrón'],
                    'correctAnswer' => 'Quark top',
                    'id' => 'backup-12'
                ],
                [
                    'question' => '¿Qué científico propuso la teoría de la relatividad general?',
                    'options' => ['Albert Einstein', 'Isaac Newton', 'Niels Bohr', 'Stephen Hawking'],
                    'correctAnswer' => 'Albert Einstein',
                    'id' => 'backup-13'
                ],
                [
                    'question' => '¿Cuál es el compuesto químico con la fórmula H2O2?',
                    'options' => ['Peróxido de hidrógeno', 'Agua', 'Ácido sulfúrico', 'Metano'],
                    'correctAnswer' => 'Peróxido de hidrógeno',
                    'id' => 'backup-14'
                ],
                [
                    'question' => '¿Qué famoso teorema relaciona los lados de un triángulo rectángulo?',
                    'options' => ['Teorema de Pitágoras', 'Teorema de Tales', 'Teorema de Fermat', 'Teorema de Bayes'],
                    'correctAnswer' => 'Teorema de Pitágoras',
                    'id' => 'backup-15'
                ]
            ]
        ];
        
        $categoryQuestions = $questions[$difficulty] ?? $questions['easy'];
        $randomIndex = array_rand($categoryQuestions);
        
        return $categoryQuestions[$randomIndex];
    }
}
