<?php
/**
 * Wikidata Question Generator - Pure PHP 8.4
 * No external libraries
 */

declare(strict_types=1);

class Wikidata
{
    private const ENDPOINT = 'https://query.wikidata.org/sparql';
    private const USER_AGENT = 'WikiMillionaire/1.0 (educational game; PHP 8.4)';

    /**
     * Get random question based on level
     */
    public static function getRandomQuestion(int $level): array
    {
        $difficulty = self::getDifficulty($level);
        
        try {
            return self::generateQuestion($difficulty);
        } catch (Exception $e) {
            error_log("Wikidata error: " . $e->getMessage());
            return self::getBackupQuestion($difficulty);
        }
    }

    /**
     * Determine difficulty from level
     */
    private static function getDifficulty(int $level): string
    {
        return match (true) {
            $level < 5 => 'easy',
            $level < 10 => 'medium',
            default => 'hard'
        };
    }

    /**
     * Generate question from Wikidata
     */
    private static function generateQuestion(string $difficulty): array
    {
        $questionTypes = self::getQuestionTypes($difficulty);
        $type = $questionTypes[array_rand($questionTypes)];

        return match ($type) {
            'capital' => self::generateCapitalQuestion(),
            'population' => self::generatePopulationQuestion(),
            'birthdate' => self::generateBirthdateQuestion(),
            'area' => self::generateAreaQuestion(),
            'height' => self::generateHeightQuestion(),
            default => self::getBackupQuestion($difficulty)
        };
    }

    /**
     * Get question types for difficulty
     */
    private static function getQuestionTypes(string $difficulty): array
    {
        return match ($difficulty) {
            'easy' => ['capital', 'population'],
            'medium' => ['capital', 'population', 'birthdate', 'area'],
            'hard' => ['birthdate', 'area', 'height', 'population'],
        };
    }

    /**
     * Generate capital city question
     */
    private static function generateCapitalQuestion(): array
    {
        $query = <<<SPARQL
SELECT ?country ?countryLabel ?capital ?capitalLabel WHERE {
  ?country wdt:P31 wd:Q6256;
           wdt:P36 ?capital.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
LIMIT 100
SPARQL;

        $data = self::queryWikidata($query);
        
        if (empty($data['results']['bindings'])) {
            throw new RuntimeException('No capital data found');
        }

        $items = $data['results']['bindings'];
        $correct = $items[array_rand($items)];
        
        $countryName = $correct['countryLabel']['value'];
        $capitalName = $correct['capitalLabel']['value'];

        // Get wrong answers
        $wrongAnswers = [];
        while (count($wrongAnswers) < 3) {
            $wrong = $items[array_rand($items)];
            $wrongCapital = $wrong['capitalLabel']['value'];
            if ($wrongCapital !== $capitalName && !in_array($wrongCapital, $wrongAnswers)) {
                $wrongAnswers[] = $wrongCapital;
            }
        }

        $options = array_merge([$capitalName], $wrongAnswers);
        shuffle($options);

        return [
            'question' => "¿Cuál es la capital de $countryName?",
            'options' => $options,
            'correctAnswer' => $capitalName,
            'id' => md5($countryName . $capitalName),
        ];
    }

    /**
     * Generate population question
     */
    private static function generatePopulationQuestion(): array
    {
        $query = <<<SPARQL
SELECT ?city ?cityLabel ?population WHERE {
  ?city wdt:P31 wd:Q515;
        wdt:P1082 ?population.
  FILTER(?population > 1000000)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
LIMIT 100
SPARQL;

        $data = self::queryWikidata($query);
        
        if (empty($data['results']['bindings'])) {
            throw new RuntimeException('No population data found');
        }

        $items = $data['results']['bindings'];
        $correct = $items[array_rand($items)];
        
        $cityName = $correct['cityLabel']['value'];
        $population = (int)$correct['population']['value'];

        // Generate wrong answers around the correct value
        $wrongAnswers = [
            number_format((int)($population * 0.5)),
            number_format((int)($population * 1.5)),
            number_format((int)($population * 2)),
        ];

        $options = array_merge([number_format($population)], $wrongAnswers);
        shuffle($options);

        return [
            'question' => "¿Cuál es aproximadamente la población de $cityName?",
            'options' => $options,
            'correctAnswer' => number_format($population),
            'id' => md5($cityName . $population),
        ];
    }

    /**
     * Generate birthdate question
     */
    private static function generateBirthdateQuestion(): array
    {
        $query = <<<SPARQL
SELECT ?person ?personLabel ?birthdate WHERE {
  ?person wdt:P31 wd:Q5;
          wdt:P569 ?birthdate;
          wdt:P106 ?occupation.
  ?occupation wdt:P279* wd:Q33999.
  FILTER(YEAR(?birthdate) > 1800 && YEAR(?birthdate) < 2000)
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
LIMIT 100
SPARQL;

        $data = self::queryWikidata($query);
        
        if (empty($data['results']['bindings'])) {
            throw new RuntimeException('No birthdate data found');
        }

        $items = $data['results']['bindings'];
        $correct = $items[array_rand($items)];
        
        $personName = $correct['personLabel']['value'];
        $birthdate = $correct['birthdate']['value'];
        $year = (int)date('Y', strtotime($birthdate));

        // Generate wrong years
        $wrongYears = [
            $year - 5,
            $year + 5,
            $year - 10,
        ];

        $options = array_merge([$year], $wrongYears);
        shuffle($options);

        return [
            'question' => "¿En qué año nació $personName?",
            'options' => array_map('strval', $options),
            'correctAnswer' => (string)$year,
            'id' => md5($personName . $year),
        ];
    }

    /**
     * Generate area question
     */
    private static function generateAreaQuestion(): array
    {
        $query = <<<SPARQL
SELECT ?country ?countryLabel ?area WHERE {
  ?country wdt:P31 wd:Q6256;
           wdt:P2046 ?area.
  SERVICE wikibase:label { bd:serviceParam wikibase:language "es,en". }
}
LIMIT 100
SPARQL;

        $data = self::queryWikidata($query);
        
        if (empty($data['results']['bindings'])) {
            throw new RuntimeException('No area data found');
        }

        $items = $data['results']['bindings'];
        $correct = $items[array_rand($items)];
        
        $countryName = $correct['countryLabel']['value'];
        $area = (int)$correct['area']['value'];

        // Generate wrong answers
        $wrongAreas = [
            number_format((int)($area * 0.5)),
            number_format((int)($area * 1.5)),
            number_format((int)($area * 0.75)),
        ];

        $options = array_merge([number_format($area)], $wrongAreas);
        shuffle($options);

        return [
            'question' => "¿Cuál es el área aproximada de $countryName en km²?",
            'options' => $options,
            'correctAnswer' => number_format($area),
            'id' => md5($countryName . $area),
        ];
    }

    /**
     * Generate height question
     */
    private static function generateHeightQuestion(): array
    {
        return self::getBackupQuestion('hard');
    }

    /**
     * Query Wikidata SPARQL endpoint
     */
    private static function queryWikidata(string $query, int $retries = 2): array
    {
        $url = self::ENDPOINT . '?query=' . urlencode($query) . '&format=json';
        
        $lastError = null;
        for ($i = 0; $i <= $retries; $i++) {
            try {
                if ($i > 0) {
                    usleep(500000 * $i); // 500ms * attempt
                }

                $context = stream_context_create([
                    'http' => [
                        'method' => 'GET',
                        'header' => "Accept: application/sparql-results+json\r\n" .
                                   "User-Agent: " . self::USER_AGENT . "\r\n",
                        'timeout' => 10,
                    ],
                ]);

                $response = file_get_contents($url, false, $context);
                
                if ($response === false) {
                    throw new RuntimeException('Failed to fetch from Wikidata');
                }

                return json_decode($response, true);
            } catch (Exception $e) {
                $lastError = $e;
                if ($i === $retries) {
                    throw $lastError;
                }
            }
        }

        throw $lastError ?? new RuntimeException('Unknown error');
    }

    /**
     * Get backup questions when Wikidata fails
     */
    private static function getBackupQuestion(string $difficulty): array
    {
        $questions = [
            'easy' => [
                [
                    'question' => '¿Cuál es la capital de Francia?',
                    'options' => ['París', 'Londres', 'Berlín', 'Madrid'],
                    'correctAnswer' => 'París',
                    'id' => 'backup_1',
                ],
                [
                    'question' => '¿Cuál es la capital de España?',
                    'options' => ['Madrid', 'Barcelona', 'Valencia', 'Sevilla'],
                    'correctAnswer' => 'Madrid',
                    'id' => 'backup_2',
                ],
            ],
            'medium' => [
                [
                    'question' => '¿En qué año se descubrió América?',
                    'options' => ['1492', '1482', '1502', '1512'],
                    'correctAnswer' => '1492',
                    'id' => 'backup_3',
                ],
            ],
            'hard' => [
                [
                    'question' => '¿Cuál es el elemento químico con número atómico 79?',
                    'options' => ['Oro', 'Plata', 'Platino', 'Mercurio'],
                    'correctAnswer' => 'Oro',
                    'id' => 'backup_4',
                ],
            ],
        ];

        $pool = $questions[$difficulty] ?? $questions['easy'];
        return $pool[array_rand($pool)];
    }
}
