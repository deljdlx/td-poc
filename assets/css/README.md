# CSS Architecture & Variables

## Centralized Variables
All CSS variables (colors, sizes, effects, etc.) are now defined in `variables.css`.
- Only override variables in component files if absolutely necessary.
- This ensures consistency and easy theming across the project.

## File Structure
- `variables.css`: All global variables.
- `style.css`: Main layout, resets, and global styles. Imports `variables.css`.
- `cell.css`, `enemy.css`, `path.css`, `popup.css`, `tower-range.css`, `tower-stats.css`: Component-specific styles. Each imports `variables.css`.

## Usage
- Use variables via `var(--variable-name)` in your CSS.
- To add a new theme value, add it to `variables.css`.

## Example
```css
@import url('./variables.css');

.grid-cell {
    background: var(--color-surface);
    border-radius: var(--cell-radius);
}
```

## Maintenance
- Avoid duplicating variable definitions in component files.
- Document any overrides with comments.
- Keep this README updated if the structure changes.
