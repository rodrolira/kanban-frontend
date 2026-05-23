import React, { useEffect } from 'react';
import { useKanban } from '../contexts/KanbanContext';

export const TestBoards: React.FC = () => {
  const { boards, isLoading, loadBoards } = useKanban();

  useEffect(() => {
    console.log('TestBoards mounted');
    loadBoards();
  }, [loadBoards]);

  if (isLoading) return <div>Cargando...</div>;

  return (
    <div>
      <h2>Tableros ({boards.length})</h2>
      <pre>{JSON.stringify(boards, null, 2)}</pre>
    </div>
  );
};