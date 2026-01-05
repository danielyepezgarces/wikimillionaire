<?php

namespace WikiMillionaire\Game;

/**
 * Language Management Service
 * 
 * Handles language selection and translation for the game interface.
 */
class Language
{
    private const SUPPORTED_LANGUAGES = ['en', 'es', 'fr', 'de', 'pt'];
    private const DEFAULT_LANGUAGE = 'en';
    private const FALLBACK_LANGUAGE = 'en';
    
    private array $translations = [];
    private string $currentLanguage;
    
    public function __construct()
    {
        // Ensure session is started
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Get current language from session or use default
        $this->currentLanguage = $_SESSION['language'] ?? self::DEFAULT_LANGUAGE;
        
        // Validate language
        if (!in_array($this->currentLanguage, self::SUPPORTED_LANGUAGES)) {
            $this->currentLanguage = self::DEFAULT_LANGUAGE;
        }
        
        // Load translations
        $this->loadTranslations($this->currentLanguage);
    }
    
    /**
     * Get current language code
     */
    public function getCurrentLanguage(): string
    {
        return $this->currentLanguage;
    }
    
    /**
     * Set current language
     */
    public function setLanguage(string $language): bool
    {
        if (!in_array($language, self::SUPPORTED_LANGUAGES)) {
            return false;
        }
        
        $this->currentLanguage = $language;
        $_SESSION['language'] = $language;
        $this->loadTranslations($language);
        
        return true;
    }
    
    /**
     * Get list of supported languages
     */
    public static function getSupportedLanguages(): array
    {
        return self::SUPPORTED_LANGUAGES;
    }
    
    /**
     * Get language name
     */
    public static function getLanguageName(string $code): string
    {
        $names = [
            'en' => 'English',
            'es' => 'Español',
            'fr' => 'Français',
            'de' => 'Deutsch',
            'pt' => 'Português'
        ];
        
        return $names[$code] ?? $code;
    }
    
    /**
     * Load translations for a language
     */
    private function loadTranslations(string $language): void
    {
        $translationFile = __DIR__ . '/../../translations/' . $language . '.json';
        
        if (file_exists($translationFile)) {
            $json = file_get_contents($translationFile);
            $this->translations = json_decode($json, true);
            
            // Check for JSON parsing errors
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("JSON parsing error in translation file {$translationFile}: " . json_last_error_msg());
                $this->translations = [];
            }
            
            // Ensure translations is an array
            if (!is_array($this->translations)) {
                $this->translations = [];
            }
        } else {
            // Fallback to English
            $fallbackFile = __DIR__ . '/../../translations/' . self::FALLBACK_LANGUAGE . '.json';
            if (file_exists($fallbackFile)) {
                $json = file_get_contents($fallbackFile);
                $this->translations = json_decode($json, true);
                
                // Check for JSON parsing errors
                if (json_last_error() !== JSON_ERROR_NONE) {
                    error_log("JSON parsing error in fallback translation file {$fallbackFile}: " . json_last_error_msg());
                    $this->translations = [];
                } else if (!is_array($this->translations)) {
                    $this->translations = [];
                }
            } else {
                $this->translations = [];
            }
        }
    }
    
    /**
     * Get translation for a key
     */
    public function get(string $key, array $replacements = []): string
    {
        $translation = $this->translations[$key] ?? $key;
        
        // Replace placeholders
        foreach ($replacements as $placeholder => $value) {
            $translation = str_replace('{' . $placeholder . '}', $value, $translation);
        }
        
        return $translation;
    }
    
    /**
     * Translate text (alias for get)
     */
    public function t(string $key, array $replacements = []): string
    {
        return $this->get($key, $replacements);
    }
}
