$(document).ready(() => {
    const $weekPicker = $('#weekPicker');
    const $currentWeekDisplay = $('#currentWeekDisplay');
    const $teacherSchedule = $('#teacherSchedule');
    const $teacherHeader = $('#teacherHeader');

    const urlParams = new URLSearchParams(window.location.search);
    let staffId = urlParams.get('staffId');
    let week = parseInt(urlParams.get('week')) || 1;


    if (!staffId) {
        $teacherSchedule.text('Не указан staffId');
        return;
    }

    function populateWeekPicker() {
        for (let i = 1; i <= 52; i++) {
            $weekPicker.append($('<option>', {
                value: i,
                text: `Неделя ${i}`
            }));
        }
    }

     function renderTeacherSchedule(teacherName, dates, scheduleData) {
        $teacherHeader.text(teacherName);
        $teacherSchedule.empty();

        const days = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
        const timeIntervals = Object.keys(scheduleData);

        const $table = $('<table>').addClass('schedule-table');
        const $thead = $('<thead>').appendTo($table);
        const $tbody = $('<tbody>').appendTo($table);

        $thead.append(
            $('<tr>').append(
                $('<th>').text('Время'),
                ...days.map((day, index) => $('<th>').text(`${day} (${dates[index] || ''})`))
            )
        );

        timeIntervals.forEach(time => {
            const $row = $('<tr>').append($('<td>').text(time));

            days.forEach(day => {
                const lessons = scheduleData[time][day];
                const $cell = $('<td>');

                if (lessons && lessons.length > 0) {
                    lessons.forEach((lesson, index) => {
                         const $lessonDiv = $('<div>').addClass(lesson.colorClass).html(
                             `<b>${lesson.subject}</b><br>${lesson.location}<br>` +
                             `Группы: ${lesson.groups.map(group => `<a href="index.html?groupId=${group.id}&week=${$weekPicker.val()}" target="_blank">${group.name}</a>`).join(', ')}`
                         );
                        $cell.append($lessonDiv);
                        if (index < lessons.length - 1) {
                            $cell.append('<hr>');
                        }
                    });
                } else {
                    $cell.text('-');
                }
                $row.append($cell);
            });
            $tbody.append($row);
        });

        $teacherSchedule.append($table);
    }

    function updateCurrentWeekDisplay(week) {
        $currentWeekDisplay.text(`Неделя ${week}`);
    }

    function updateNavigationButtons(weekNumber) {
        const prevWeek = weekNumber > 1 ? weekNumber - 1 : 52;
        const nextWeek = weekNumber < 52 ? parseInt(weekNumber) + 1 : 1;

        document.getElementById('prevWeek').textContent = `Неделя ${prevWeek}`;
        document.getElementById('nextWeek').textContent = `Неделя ${nextWeek}`;
    }

    function updateUrlParams(staffId, week) {
        const url = new URL(window.location.href);
        url.searchParams.set('staffId', staffId);
        url.searchParams.set('week', week);
        window.history.pushState({}, '', url.toString());
    }

    function loadTeacherSchedule(staffId, week) {
        $.getJSON(`/api/teachersSchedule?staffId=${staffId}&week=${week}`, (response) => {
            console.log(response, 1)
            renderTeacherSchedule(response.teacherName, response.dates, response.schedule);
            updateCurrentWeekDisplay(week);
            updateNavigationButtons(week);
        }).fail((error) => {
            console.error('Ошибка при загрузке расписания преподавателя:', error);
            $teacherSchedule.text('Ошибка при загрузке расписания');
        });
    }

    populateWeekPicker();

    if (week) {
        $weekPicker.val(week);
    }

    $weekPicker.change(() => {
        const selectedWeek = parseInt($weekPicker.val(), 10);
        loadTeacherSchedule(staffId, selectedWeek);
        updateUrlParams(staffId, selectedWeek);
    });

    document.getElementById('prevWeek').addEventListener('click', () => {
        let currentWeek = parseInt($weekPicker.val(), 10);
        if (currentWeek > 1) {
            $weekPicker.val(currentWeek - 1).trigger('change');
        } else {
            $weekPicker.val(52).trigger('change');
        }
    });

    document.getElementById('nextWeek').addEventListener('click', () => {
        let currentWeek = parseInt($weekPicker.val(), 10);
        if (currentWeek < 52) {
            $weekPicker.val(currentWeek + 1).trigger('change');
        } else {
            $weekPicker.val(1).trigger('change');
        }
    });

    loadTeacherSchedule(staffId, week);
});

