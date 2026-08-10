import React from 'react';
import { X, Calendar, BookOpen, Users } from 'lucide-react';
import { Student, Grade, Section, EnrollmentRecord } from '../../types';

interface StudentHistoryProps {
  student: Student;
  grades: Grade[];
  sections: Section[];
  onClose: () => void;
}

export default function StudentHistory({ student, grades, sections, onClose }: StudentHistoryProps) {
  const getSectionName = (id: string) => {
    const section = sections.find(s => s.id === id);
    return section ? `Sección ${section.name}` : '—';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_CURSO': return 'bg-emerald-100 text-emerald-700';
      case 'FINALIZADO': return 'bg-blue-100 text-blue-700';
      case 'RETIRADO': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'EN_CURSO': return 'En Curso';
      case 'FINALIZADO': return 'Finalizado';
      case 'RETIRADO': return 'Retirado';
      default: return status;
    }
  };

  // Ordenar el historial cronológicamente
  const sortedHistory = [...(student.enrollmentHistory || [])]
    .sort((a, b) => a.year - b.year)
    .filter((record, index, self) => index === self.findIndex(r => r.year === record.year));

  return (
    <div className="modal-backdrop">
      <div className="modal-container max-w-2xl">
        <div className="modal-header">
          <div>
            <h3 className="modal-title">Historial Académico</h3>
            <p className="text-sm text-slate-400">{student.name}</p>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          {sortedHistory.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <p>No hay historial académico registrado.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedHistory.map((record, idx) => (
                <div key={idx} className="flex items-start gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-slate-400" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-bold text-slate-900">{record.year}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusColor(record.status)}`}>
                        {getStatusLabel(record.status)}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-slate-700">
                        <BookOpen className="w-4 h-4 text-slate-400" />
                        <span className="font-medium">{record.gradeName || record.gradeId}</span>
                      </div>
                      {record.sectionId && (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Users className="w-4 h-4 text-slate-400" />
                          <span className="font-medium">{getSectionName(record.sectionId)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="pt-4 border-t border-slate-100">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-extrabold text-slate-900">{sortedHistory.length}</div>
                <div className="text-xs text-slate-500">Años cursados</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-extrabold text-emerald-600">
                  {sortedHistory.filter(r => r.status === 'EN_CURSO').length}
                </div>
                <div className="text-xs text-slate-500">Año actual</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
