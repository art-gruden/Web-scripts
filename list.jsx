// pages/index.jsx
import fs from 'fs';
import path from 'path';

export default function Home({ files }) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Список файлов</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {files.map((file) => (
          <li key={file} style={{ margin: '0.5rem 0' }}>
            <a href={`/${file}`} target="_blank" rel="noopener noreferrer">
              {file}
            </a>
            <span style={{ marginLeft: '1rem', color: '#666' }}>
              ({file.endsWith('.html') ? 'страница' : 'исходник JSX'})
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export async function getStaticProps() {
  // Путь к папке public
  const publicDir = path.join(process.cwd(), 'public');
  
  // Читаем все файлы
  const allFiles = fs.readdirSync(publicDir);
  
  // Фильтруем только .html и .jsx (можно добавить и другие)
  const filteredFiles = allFiles.filter((file) =>
    /\.(html|jsx)$/i.test(file)
  );

  return {
    props: {
      files: filteredFiles,
    },
  };
}