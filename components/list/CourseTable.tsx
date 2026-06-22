import CourseRow from "./CourseRow";


const CourseTable = ({ courses = [], onCreate, onEdit, onDelete }) => (
  <>
    <button onClick={onCreate}>Create Course</button>
    <table>
      <tbody>
        {(Array.isArray(courses) ? courses : []).map(course => (
          <CourseRow
            key={course.id}
            course={course}
            onEdit={() => onEdit(course)}
            onDelete={() => onDelete(course.id)}
          />
        ))}
      </tbody>
    </table>
  </>
);

export default CourseTable;