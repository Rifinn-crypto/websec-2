
const express = require('express');
const axios = require('axios');
const cheerio = require('cheerio');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const config = {
    ssauBaseUrl: 'https://ssau.ru',
    raspEndpoint: '/rasp',
    staffEndpoint: '/staffId',
    port: 3000,
    groupNumberIds: {
        "1282690301": "6411-100503D",
        "1282690279": "6412-100503D",
        "1213641978": "6413-100503D"
    },
    weeksInSemester: 52
};

app.get('/api/groups', (req, res) => {
    const groups = Object.entries(config.groupNumberIds).map(([id, identifier]) => {
        const [groupCode] = identifier.split('-');
        return {
            id: id,
            name: groupCode
        };
    });
    res.json(groups);
});

app.get('/api/teachers', async (req, res) => {
    try {
        const url = config.ssauBaseUrl + config.staffEndpoint;
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        const teachers = [];
        $('.list-group-item').each((index, element) => {
            const link = $(element).find('a');
            const name = link.text().trim();
            const href = link.attr('href');
            const staffId = href ? href.split('staffId=')[1] : null;
            if (staffId && name) {
                teachers.push({
                    id: staffId,
                    name: name
                });
            }
        });

        res.json(teachers);
    } catch (error) {
        console.error('Error fetching teachers:', error);
        res.status(500).json({ error: 'Failed to retrieve teachers' });
    }
});

app.use((err, req, res, next) => {
    console.error("Global error handler caught an error:", err);
    res.status(500).json({ error: "Internal Server Error.  Please try again later." });
});

// Helper Functions
function extractTeacherIdFromHref(href) {
    if (!href) {
        console.warn("Teacher link href is undefined.");
        return null;
    }

    const match = href.match(/staffId=([a-zA-Z0-9]+)/);
    if (match && match[1]) {
        return match[1];
    } else {
        console.warn("Could not extract staffId from href:", href);
        return null;
    }
}

//PARSING
function parseGroupSchedule($, name) {
    const scheduleData = {};
    const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const dates = [];

    $('.schedule__item.schedule__head').each((index, elem) => {
        const date = $(elem).find('.caption-text.schedule__head-date').text().trim();
        if (date) dates.push(date);
    });

    const timeSlots = [];
    $('.schedule__time-item').each((index, element) => {
        const time = $(element).text().trim();
        timeSlots.push(time);
    });

    const timeIntervals = [];
    for (let i = 0; i < timeSlots.length; i += 2) {
        timeIntervals.push(`${timeSlots[i]} - ${timeSlots[i + 1]}`);
    }

    timeIntervals.forEach(time => {
        scheduleData[time] = {};
        daysOfWeek.forEach(day => {
            scheduleData[time][day] = [];
        });
    });

    $('.schedule__item:not(.schedule__head)').each((index, element) => {
        const dayIndex = index % daysOfWeek.length;
        const timeIndex = Math.floor(index / daysOfWeek.length);
        const time = timeIntervals[timeIndex];
        const day = daysOfWeek[dayIndex];
        const lessons = [];

        $(element).find('.schedule__lesson').each((_, lessonElement) => {
            const lesson = $(lessonElement);
            const typeClass = lesson.find('.schedule__lesson-type-chip').attr('class') || '';
            const subject = lesson.find('.body-text.schedule__discipline').text().trim();
            const location = lesson.find('.caption-text.schedule__place').text().trim();

            let teacherName = "Преподаватель неизвестен";
            let teacherId = null;

            try {
                const teacherLink = lesson.find('.schedule__teacher a');
                teacherName = teacherLink.text().trim();
                teacherId = extractTeacherIdFromHref(teacherLink.attr('href'));
            } catch (err) {
                console.warn("Could not extract teacher information:", err);
            }

            const groups = [];
            lesson.find('a.caption-text.schedule__group').each((_, groupElem) => {
                const groupName = $(groupElem).text().trim();
                const groupId = $(groupElem).attr('href').split('=')[1];
                groups.push({ id: groupId, name: groupName });
            });

            let colorClass = '';
            if (typeClass.includes('lesson-type-1__bg')) {
                colorClass = 'green';
            } else if (typeClass.includes('lesson-type-2__bg')) {
                colorClass = 'pink';
            } else if (typeClass.includes('lesson-type-3__bg')) {
                colorClass = 'blue';
            } else if (typeClass.includes('lesson-type-4__bg')) {
                colorClass = 'orange';
            } else if (typeClass.includes('lesson-type-5__bg')) {
                colorClass = 'dark-blue';
            } else if (typeClass.includes('lesson-type-6__bg')) {
                colorClass = 'turquoise';
            }
            lessons.push({
                subject: subject,
                location: location,
                teacher: teacherName,
                teacherId: teacherId,
                groups: groups,
                colorClass: colorClass
            });
        });

        scheduleData[time][day] = lessons;
    });
    return scheduleData;
}

function parseTeacherSchedule($, name) {
    const scheduleData = {};
    const daysOfWeek = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'];
    const dates = [];

    $('.schedule__item.schedule__head').each((index, elem) => {
        const date = $(elem).find('.caption-text.schedule__head-date').text().trim();
        if (date) dates.push(date);
    });

    const timeSlots = [];
    $('.schedule__time-item').each((index, element) => {
        const time = $(element).text().trim();
        timeSlots.push(time);
    });

    const timeIntervals = [];
    for (let i = 0; i < timeSlots.length; i += 2) {
        timeIntervals.push(`${timeSlots[i]} - ${timeSlots[i + 1]}`);
    }

    timeIntervals.forEach(time => {
        scheduleData[time] = {};
        daysOfWeek.forEach(day => {
            scheduleData[time][day] = [];
        });
    });

    $('.schedule__item:not(.schedule__head)').each((index, element) => {
        const dayIndex = index % daysOfWeek.length;
        const timeIndex = Math.floor(index / daysOfWeek.length);
        const time = timeIntervals[timeIndex];
        const day = daysOfWeek[dayIndex];
        const lessons = [];

        $(element).find('.schedule__lesson').each((_, lessonElement) => {
            const lesson = $(lessonElement);
            const typeClass = lesson.find('.schedule__lesson-type-chip').attr('class') || '';
            const subject = lesson.find('.body-text.schedule__discipline').text().trim();
            const location = lesson.find('.caption-text.schedule__place').text().trim();

            let teacherName = name; 
            let teacherId = null;

            const groups = [];
            lesson.find('a.caption-text.schedule__group').each((_, groupElem) => {
                const groupName = $(groupElem).text().trim();
                const groupId = $(groupElem).attr('href').split('=')[1];
                groups.push({ id: groupId, name: groupName });
            });

            let colorClass = '';
            if (typeClass.includes('lesson-type-1__bg')) {
                colorClass = 'green';
            } else if (typeClass.includes('lesson-type-2__bg')) {
                colorClass = 'pink';
            } else if (typeClass.includes('lesson-type-3__bg')) {
                colorClass = 'blue';
            } else if (typeClass.includes('lesson-type-4__bg')) {
                colorClass = 'orange';
            } else if (typeClass.includes('lesson-type-5__bg')) {
                colorClass = 'dark-blue';
            } else if (typeClass.includes('lesson-type-6__bg')) {
                colorClass = 'turquoise';
            }
            lessons.push({
                subject: subject,
                location: location,
                teacher: teacherName,
                teacherId: teacherId,
                groups: groups,
                colorClass: colorClass
            });
        });

        scheduleData[time][day] = lessons;
    });
    return scheduleData;
}

async function fetchAndParseSchedule(url, type = 'group') {
    try {
        const response = await axios.get(url);
        const $ = cheerio.load(response.data);

        let name = '';
        try {
            name = $('.page-header h1.h1-text').text().trim();
        } catch (err) {
            console.warn("Could not extract name:", err);
            throw new Error('Could not determine group or teacher name.');
        }

        if (!name) {
            throw new Error('Could not determine group or teacher name.');
        }

        let scheduleData;
        if (type === 'group') {
            scheduleData = parseGroupSchedule($, name);
        } else {
            scheduleData = parseTeacherSchedule($, name);
        }

        let groupInfo = null;
        if (type === 'group') {
            const groupInfoBlock = $('.card-default.info-block');
            if (groupInfoBlock.length) {
                let groupDescription = '';
                groupInfoBlock.find('.info-block__description div').each((_, descElem) => {
                    groupDescription += $(descElem).text().trim() + '<br>';
                });
                const groupTitle = groupInfoBlock.find('.info-block__title').text().trim();
                const groupSemesterInfo = groupInfoBlock.find('.info-block__semester div').text().trim();
                groupInfo = {
                    title: groupTitle,
                    description: groupDescription,
                    semesterInfo: groupSemesterInfo
                };
            }
        }

        let dates = [];
        $('.schedule__item.schedule__head').each((index, elem) => {
            const date = $(elem).find('.caption-text.schedule__head-date').text().trim();
            if (date) dates.push(date);
        });

        return {
            name: name,
            dates: dates,
            schedule: scheduleData,
            groupInfo: groupInfo
        };
    } catch (error) {
        console.error('Error fetching or parsing schedule:', error);
        throw error;
    }
}

app.get('/api/schedule', async (req, res) => {
    const { groupId, week, staffId } = req.query;

    if (!week) {
        return res.status(400).json({ error: 'Missing week parameter' });
    }

    let url = config.ssauBaseUrl + config.raspEndpoint;
    let scheduleType = 'group';
    let id;

    if (groupId) {
        url += `?groupId=${groupId}&selectedWeek=${week}`;
        id = groupId;
    } else if (staffId) {
        url += `?staffId=${staffId}&selectedWeek=${week}`;
        scheduleType = 'teacher';
        id = staffId;
    } else {
        return res.status(400).json({ error: 'Missing groupId or staffId parameter' });
    }

    try {
        const scheduleData = await fetchAndParseSchedule(url, scheduleType);

        let responseData = {
            week: week,
            schedule: scheduleData.schedule,
            dates: scheduleData.dates
        };

        if (scheduleType === 'group') {
            responseData.groupId = groupId;
            responseData.groupName = scheduleData.name;
            responseData.groupInfo = scheduleData.groupInfo;
        } else {
            responseData.staffId = staffId;
            responseData.teacherName = scheduleData.name;
        }

        res.json(responseData);
    } catch (error) {
        console.error("API Schedule Error:", error);
        res.status(500).json({ error: 'Failed to retrieve schedule data' });
    }
});

app.get('/api/teachersSchedule', async (req, res) => {
    const { staffId, week } = req.query;
    console.log(req)
    if (!staffId) {
        return res.status(400).json({ error: 'Missing staffId parameter' });
    }

    if (!week) {
        return res.status(400).json({ error: 'Missing week parameter' });
    }

    const url = `${config.ssauBaseUrl}${config.raspEndpoint}?staffId=${staffId}&selectedWeek=${week}`;
    const scheduleType = 'teacher'; 

    try {
        const scheduleData = await fetchAndParseSchedule(url, scheduleType);

        const responseData = {
            week: week,
            staffId: staffId,
            teacherName: scheduleData.name,
            schedule: scheduleData.schedule,
            dates: scheduleData.dates
        };
        res.json(responseData);

    } catch (error) {
        console.error("API teachersSchedule Error:", error);
        res.status(500).json({ error: 'Failed to retrieve teacher schedule data' });
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(config.port, () => {
    console.log(`Server listening on port ${config.port}`);
});
