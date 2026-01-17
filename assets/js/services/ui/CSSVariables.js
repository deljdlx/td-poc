/**
 * Classe utilitaire pour lire et écrire des variables CSS
 */
export class CSSVariables {
    /**
     * Lit une variable CSS et retourne un entier
     * @param {string} varName - Nom de la variable (ex: '--cell-gap')
     * @returns {number}
     */
    static getInt(varName) {
        return parseInt(
            getComputedStyle(document.documentElement)
                .getPropertyValue(varName)
        );
    }

    /**
     * Lit une variable CSS et retourne un nombre flottant
     * @param {string} varName - Nom de la variable
     * @returns {number}
     */
    static getFloat(varName) {
        return parseFloat(
            getComputedStyle(document.documentElement)
                .getPropertyValue(varName)
        );
    }

    /**
     * Lit une variable CSS et retourne la valeur brute
     * @param {string} varName - Nom de la variable
     * @returns {string}
     */
    static get(varName) {
        return getComputedStyle(document.documentElement)
            .getPropertyValue(varName)
            .trim();
    }

    /**
     * Définit une variable CSS
     * @param {string} varName - Nom de la variable
     * @param {string} value - Valeur à définir
     * @returns {void}
     */
    static set(varName, value) {
        document.documentElement.style.setProperty(varName, value);
    }
}
