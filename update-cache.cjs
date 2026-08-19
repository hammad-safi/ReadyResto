const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, 'src/pages');

const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));
for (const file of files) {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');
  
  if (content.includes('useDataCache()') && !content.includes('cacheTick')) {
    // Inject cacheTick into useDataCache destructuring
    content = content.replace(/const\s*\{\s*([^}]+)\s*\}\s*=\s*useDataCache\(\);/g, (match, p1) => {
      // Avoid duplicate cacheTick if it was already there (though we checked !includes)
      return `const { ${p1.trim()}, cacheTick } = useDataCache();`;
    });
    
    // Inject cacheTick into dependency array of useEffects that call load()
    // It's usually `useEffect(() => { load(); }, []);`
    // Or `useEffect(() => { fetchDash(); }, []);` in Dashboard
    content = content.replace(/useEffect\(\(\)\s*=>\s*\{[^}]*load\(\);[^}]*\},\s*\[\]\);/g, match => {
      return match.replace(/\[\]\);/, '[cacheTick]);');
    });

    content = content.replace(/useEffect\(\(\)\s*=>\s*\{[^}]*fetchDash\(\);[^}]*\},\s*\[\]\);/g, match => {
      return match.replace(/\[\]\);/, '[cacheTick]);');
    });

    content = content.replace(/useEffect\(\(\)\s*=>\s*\{[^}]*fetchOverview\(\);[^}]*\},\s*\[\]\);/g, match => {
      return match.replace(/\[\]\);/, '[cacheTick]);');
    });

    content = content.replace(/useEffect\(\(\)\s*=>\s*\{\s*getData\([^}]*\},\s*\[\]\);/g, match => {
      return match.replace(/\[\]\);/, '[cacheTick]);');
    });

    fs.writeFileSync(fp, content);
    console.log(`Updated ${file}`);
  }
}
