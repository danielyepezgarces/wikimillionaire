<?php
/**
 * Template Helper Functions
 * 
 * Common functions used across templates
 */

require_once __DIR__ . '/../vendor/autoload.php';

use WikiMillionaire\Game\Language;

/**
 * Get language service instance
 */
function getLanguageService(): Language {
    static $languageService = null;
    
    if ($languageService === null) {
        $languageService = new Language();
    }
    
    return $languageService;
}

/**
 * Translate a key
 */
function t(string $key, array $replacements = []): string {
    return getLanguageService()->get($key, $replacements);
}

/**
 * Get current language code
 */
function getCurrentLanguage(): string {
    return getLanguageService()->getCurrentLanguage();
}

/**
 * Get language name
 */
function getLanguageName(string $code): string {
    return Language::getLanguageName($code);
}

/**
 * Render language selector
 */
function renderLanguageSelector(): string {
    $currentLang = getCurrentLanguage();
    $languages = Language::getSupportedLanguages();
    
    $html = '<div class="relative inline-block language-selector">';
    $html .= '<button class="flex h-9 w-9 items-center justify-center rounded-full border border-purple-700 text-white hover:bg-purple-800/50" aria-label="' . t('nav_select_language') . '" id="languageDropdownBtn">';
    $html .= '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-globe h-4 w-4">';
    $html .= '<circle cx="12" cy="12" r="10"></circle>';
    $html .= '<path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>';
    $html .= '<path d="M2 12h20"></path>';
    $html .= '</svg>';
    $html .= '</button>';
    $html .= '<div class="hidden absolute right-0 mt-2 w-40 rounded-md bg-purple-900 border border-purple-700 shadow-lg z-50" id="languageDropdown">';
    
    foreach ($languages as $lang) {
        $name = getLanguageName($lang);
        $active = $lang === $currentLang ? 'bg-purple-800' : '';
        $html .= '<a href="#" class="block px-4 py-2 text-sm text-white hover:bg-purple-800 ' . $active . '" data-language="' . $lang . '">';
        $html .= $name;
        $html .= '</a>';
    }
    
    $html .= '</div>';
    $html .= '</div>';
    
    // Add JavaScript for dropdown functionality
    $html .= '<script>';
    $html .= 'document.addEventListener("DOMContentLoaded", function() {';
    $html .= '  const dropdownBtn = document.getElementById("languageDropdownBtn");';
    $html .= '  const dropdown = document.getElementById("languageDropdown");';
    $html .= '  if (dropdownBtn && dropdown) {';
    $html .= '    dropdownBtn.addEventListener("click", function(e) {';
    $html .= '      e.preventDefault();';
    $html .= '      dropdown.classList.toggle("hidden");';
    $html .= '    });';
    $html .= '    document.addEventListener("click", function(e) {';
    $html .= '      if (!dropdownBtn.contains(e.target) && !dropdown.contains(e.target)) {';
    $html .= '        dropdown.classList.add("hidden");';
    $html .= '      }';
    $html .= '    });';
    $html .= '    dropdown.querySelectorAll("a").forEach(function(link) {';
    $html .= '      link.addEventListener("click", async function(e) {';
    $html .= '        e.preventDefault();';
    $html .= '        const language = this.getAttribute("data-language");';
    $html .= '        try {';
    $html .= '          const response = await fetch("/api.php?action=setLanguage", {';
    $html .= '            method: "POST",';
    $html .= '            headers: { "Content-Type": "application/x-www-form-urlencoded" },';
    $html .= '            body: "language=" + language';
    $html .= '          });';
    $html .= '          const result = await response.json();';
    $html .= '          if (result.success) {';
    $html .= '            window.location.reload();';
    $html .= '          }';
    $html .= '        } catch (error) {';
    $html .= '          console.error("Error setting language:", error);';
    $html .= '        }';
    $html .= '      });';
    $html .= '    });';
    $html .= '  }';
    $html .= '});';
    $html .= '</script>';
    
    return $html;
}
