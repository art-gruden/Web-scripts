// pages/index.jsx
//
//   /                  -> /cv.html
//   /index.html        -> /cv.html     (через rewrite у next.config.js)
//   /index.html?topic  -> /topic.html
//   /index.html?list   -> список файлів
//
// Перенаправлення виконується в браузері, бо сторінка статична (getStaticProps),
// а query-параметри відомі тільки на клієнті. Список файлів будується під час збірки.
import fs from 'fs';
import path from 'path';
import { useEffect, useState } from 'react';

export default function Home({ files }) {
  const [showList, setShowList] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    if (params.has('list')) {
      setShowList(true);
      return;
    }

    // replace(), щоб кнопка «Назад» не повертала на проміжну сторінку
    window.location.replace(params.has('topic') ? '/topic.html' : '/cv.html');
  }, []);

  if (!showList) {
    // Те, що бачить браузер до редіректу (і користувачі без JavaScript)
    return (
      <noscript>
        <a href="/cv.html">/cv.html</a>
      </noscript>
    );
  }

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Список файлів</h1>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        {files.map((file) => {
          // Формуємо правильне посилання
          let href;
          if (file.endsWith('.jsx')) {
            // Для JSX прибираємо розширення
            href = '/' + file.replace(/\.jsx$/, '');
          } else {
            // Для HTML залишаємо як є
            href = '/' + file;
          }

          return (
            <li key={file} style={{ margin: '0.5rem 0' }}>
              <a href={href} target="_blank" rel="noopener noreferrer">
                {file}
              </a>
              <span style={{ marginLeft: '1rem', color: '#666' }}>
                ({file.endsWith('.html') ? 'сторінка' : 'інтерактивна сторінка'})
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export async function getStaticProps() {
  // Читаємо файли з папки public (там лежать тільки .html та, можливо, інші статичні файли)
  const publicDir = path.join(process.cwd(), 'public');
  // Перевіряємо існування папки
  if (!fs.existsSync(publicDir)) {
    return { props: { files: [] } };
  }

  const allFiles = fs.readdirSync(publicDir);
  // Фільтруємо .html та .jsx (хоча .jsx ми вже не зберігаємо в public, але для сумісності залишаємо)
  const filteredFiles = allFiles.filter((file) =>
    /\.(html|jsx)$/i.test(file)
  );

  return {
    props: {
      files: filteredFiles,
    },
  };
}
