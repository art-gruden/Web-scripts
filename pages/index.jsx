// pages/index.jsx
import fs from 'fs';
import path from 'path';

export default function Home({ files }) {
  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Список файлов</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {files.map((file) => {
          // Формируем правильную ссылку
          let href;
          if (file.endsWith('.jsx')) {
            // Для JSX убираем расширение
            href = '/' + file.replace(/\.jsx$/, '');
          } else {
            // Для HTML оставляем как есть
            href = '/' + file;
          }

          return (
            <li key={file} style={{ margin: '0.5rem 0' }}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {file}
              </a>
              <span style={{ marginLeft: '1rem', color: '#666' }}>
                ({file.endsWith('.html') ? 'страница' : 'интерактивная страница'})
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export async function getStaticProps() {
  // Читаем файлы из папки public (там лежат только .html и, возможно, другие статические файлы)
  const publicDir = path.join(process.cwd(), 'public');
  // Проверяем существование папки
  if (!fs.existsSync(publicDir)) {
    return { props: { files: [] } };
  }

  const allFiles = fs.readdirSync(publicDir);
  // Фильтруем .html и .jsx (хотя .jsx мы уже не храним в public, но для совместимости оставляем)
  const filteredFiles = allFiles.filter((file) =>
    /\.(html|jsx)$/i.test(file)
  );

  return {
    props: {
      files: filteredFiles,
    },
  };
}