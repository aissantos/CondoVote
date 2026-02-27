/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RoleSelection from './pages/RoleSelection';
import CheckIn from './pages/resident/CheckIn';
import Topics from './pages/resident/Topics';
import Voting from './pages/resident/Voting';
import Success from './pages/resident/Success';
import AdminDashboard from './pages/admin/Dashboard';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<RoleSelection />} />
        <Route path="/check-in" element={<CheckIn />} />
        <Route path="/topics" element={<Topics />} />
        <Route path="/voting" element={<Voting />} />
        <Route path="/success" element={<Success />} />
        <Route path="/admin/*" element={<AdminDashboard />} />
      </Routes>
    </BrowserRouter>
  );
}
