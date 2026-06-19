import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import CoursePlayer from '../../components/CoursePlayer/CoursePlayer';

const CoursePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1.25rem' }}>
      <CoursePlayer courseId={id} onBack={() => navigate('/classrooms')} />
    </div>
  );
};

export default CoursePage;
