import React from 'react'

const LessonCard = React.memo(({ lesson, onChange }) => (
  <input
    value={lesson.title}
    onChange={e =>
      onChange({ ...lesson, title: e.target.value })
    }
  />
));
export default LessonCard;