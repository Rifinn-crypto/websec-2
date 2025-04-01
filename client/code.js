
document.addEventListener('DOMContentLoaded', function() {
    const groupSelect = document.getElementById('group-select');
    const teacherSelect = document.getElementById('teacher-select');
    const prevWeekButton = document.getElementById('prev-week');
    const nextWeekButton = document.getElementById('next-week');
    const currentWeekNameSpan = document.getElementById('current-week-name');
    const scheduleDiv = document.getElementById('schedule');

    const timeSlots = [
      '8:00-9:35',
      '9:45-11:20',
      '11:30-13:05',
      '13:30-15:05',
      '15:30-17:05',
      '17:15-18:45'
    ];

    let currentWeekIndex = 0; 
    let weeksData = [];

    async function fetchData(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.error('Ошибка при загрузке данных:', error);
            scheduleDiv.innerHTML = '<p>Ошибка при загрузке данных. Пожалуйста, обновите страницу.</p>';
            return null;
        }
    }

    async function loadGroups() {
        const groups = await fetchData('/api/groups');
        if (groups) {
            groups.forEach(group => {
                const option = document.createElement('option');
                option.value = group.id;
                option.textContent = group.name;
                groupSelect.appendChild(option);
            });
        }
    }

    async function loadTeachers() {
        const teachers = await fetchData('/api/teachers');
        if (teachers) {
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.id;
                option.textContent = teacher.name;
                teacherSelect.appendChild(option);
            });
        }
    }

    async function loadWeeks() {
        weeksData = await fetchData('/api/weeks');
        if (weeksData) {
            weeksData.forEach((week, index) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = week.name;
            });
        }
    }

    function getDateForDayOfWeek(startDate, dayOfWeek) {
        const days = ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const dayIndex = days.indexOf(dayOfWeek);
        if (dayIndex === -1) {
            console.error(`Неизвестный день недели: ${dayOfWeek}`);
            return null;
        }

        const startDateObj = new Date(startDate);
        const dayDiff = dayIndex - startDateObj.getDay();
        const targetDate = new Date(startDateObj);
        targetDate.setDate(startDateObj.getDate() + dayDiff);

        const day = String(targetDate.getDate()).padStart(2, '0');
        const month = String(targetDate.getMonth() + 1).padStart(2, '0');
        const year = targetDate.getFullYear();

        return `${day}.${month}.${year}`;
    }

    async function displaySchedule(weekIndex) {
        if (!weeksData || weeksData.length === 0) {
            console.error("Данные о неделях еще не загружены.");
            return;
        }

        if (weekIndex < 0 || weekIndex >= weeksData.length) {
            console.error(`Недопустимый индекс недели: ${weekIndex}`);
            return;
        }

        const week = weeksData[weekIndex];
        currentWeekNameSpan.textContent = week.name;

        const groupId = groupSelect.value;
        const teacherId = teacherSelect.value;
        const weekId = week.id;
        let apiUrl = `/api/schedule?weekId=${weekId}`;

        if (groupId) {
            apiUrl += `&groupId=${groupId}`;
        }

        if (teacherId) {
            apiUrl += `&teacherId=${teacherId}`;
        }

        const scheduleData = await fetchData(apiUrl);
        const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        headerRow.appendChild(document.createElement('th'));

        daysOfWeek.forEach(day => {
            const th = document.createElement('th');
            const date = getDateForDayOfWeek(week.startDate, day);
            th.textContent = `${day}, ${date || 'Дата не определена'}`;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const tbody = document.createElement('tbody');

        timeSlots.forEach(timeSlot => {
            const row = document.createElement('tr');
            const timeSlotCell = document.createElement('td');
            timeSlotCell.classList.add('time-slot');
            timeSlotCell.textContent = timeSlot;
            row.appendChild(timeSlotCell);

            daysOfWeek.forEach(day => {
                const dayCell = document.createElement('td');

                const lessonsForSlot = scheduleData ? scheduleData.filter(lesson =>
                    lesson.dayOfWeek === day && lesson.time === timeSlot
                ) : [];

                lessonsForSlot.forEach(lesson => {
                    const lessonDiv = document.createElement('div');
                    lessonDiv.classList.add('lesson');
                    lessonDiv.textContent = `${lesson.subject} (${lesson.classroom}) - ${lesson.teacherName}`;
                    dayCell.appendChild(lessonDiv);
                });
                row.appendChild(dayCell);
            });

            tbody.appendChild(row);
        });

        table.appendChild(tbody);
        scheduleDiv.innerHTML = '';
        scheduleDiv.appendChild(table);
    }

    prevWeekButton.addEventListener('click', () => {
        currentWeekIndex = Math.max(0, currentWeekIndex - 1);
        displaySchedule(currentWeekIndex);
    });

    nextWeekButton.addEventListener('click', () => {
        currentWeekIndex = Math.min(weeksData.length - 1, currentWeekIndex + 1);
        displaySchedule(currentWeekIndex);
    });

    groupSelect.addEventListener('change', () => {
        displaySchedule(currentWeekIndex);
    });

    teacherSelect.addEventListener('change', () => {
        displaySchedule(currentWeekIndex);
    });

    async function initialize() {
        await loadGroups();
        await loadTeachers();
        await loadWeeks(); 
        displaySchedule(currentWeekIndex);
    }

    initialize();
});
