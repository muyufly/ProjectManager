import React, { useContext, useState } from 'react';
import { AppContext } from '../constants';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const CalendarView: React.FC = () => {
  const { state } = useContext(AppContext);
  const { tasks, currentUser } = state;
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Filter tasks for current user
  const myTasks = currentUser ? tasks.filter(t => t.assigneeId === currentUser.id) : [];

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const renderDays = () => {
    const days = [];
    const emptyDays = Array(firstDay).fill(null);
    const dateArray = [...emptyDays, ...Array.from({ length: daysInMonth }, (_, i) => i + 1)];

    return dateArray.map((day, index) => {
      if (!day) return <div key={`empty-${index}`} className="bg-slate-50/50 h-32 border border-slate-100"></div>;

      const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const daysTasks = myTasks.filter(t => t.dueDate === dateStr);

      return (
        <div key={day} className="bg-white h-32 border border-slate-100 p-2 hover:bg-slate-50 transition-colors overflow-y-auto">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-sm font-medium ${new Date().toISOString().split('T')[0] === dateStr
                ? 'bg-indigo-600 text-white w-6 h-6 flex items-center justify-center rounded-full'
                : 'text-slate-700'
              }`}>
              {day}
            </span>
            {daysTasks.length > 0 && <span className="text-[10px] text-slate-400">{daysTasks.length} tasks</span>}
          </div>
          <div className="space-y-1">
            {daysTasks.map(task => (
              <div key={task.id} className={`text-[10px] p-1 rounded truncate border-l-2 ${task.priority === 'HIGH' ? 'bg-red-50 border-red-500 text-red-700' :
                  task.priority === 'MEDIUM' ? 'bg-orange-50 border-orange-500 text-orange-700' :
                    'bg-blue-50 border-blue-500 text-blue-700'
                }`}>
                {task.title}
              </div>
            ))}
          </div>
        </div>
      );
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">My Calendar</h2>
        <div className="flex items-center gap-4">
          <span className="text-lg font-medium text-slate-600">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronLeft size={20} className="text-slate-600" />
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-slate-100 rounded">
              <ChevronRight size={20} className="text-slate-600" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="py-2 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {renderDays()}
      </div>
    </div>
  );
};