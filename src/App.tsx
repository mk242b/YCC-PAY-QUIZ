/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HostDisplay } from './components/HostDisplay';
import { PlayerRemote } from './components/PlayerRemote';
import { QuestionEditor } from './components/QuestionEditor';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/host" />} />
        <Route path="/host" element={<HostDisplay />} />
        <Route path="/player" element={<PlayerRemote />} />
        <Route path="/editor" element={<QuestionEditor />} />
      </Routes>
    </BrowserRouter>
  );
}
