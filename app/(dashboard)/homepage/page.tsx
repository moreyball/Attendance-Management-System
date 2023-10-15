"use client";

import SideBarDesktop from "@/components/layouts/SideBarDesktop";
import SideBarMobile from "@/components/layouts/SideBarMobile";
import TopBar from "@/components/layouts/TopBar";
import CreateEvent_Modal from "@/components/CreateEvent_Modal";
import ViewEvent_Modal from "@/components/ViewEvent_Modal";
import EditEvent_Modal from "@/components/EditEvent_Modal";
import Success_Modal from "@/components/Modal";
import Delete_Event_Confirmation_Modal from "@/components/Modal";
import { Chart } from 'chart.js/auto';

import Image from "next/image";
import { useState, useEffect, SyntheticEvent, useRef } from "react";
import Link from "next/link";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCalendar, faUsers, faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { IoIosAddCircleOutline } from "react-icons/io";
import { HiMiniCalendarDays } from "react-icons/hi2";
import { FiClock } from "react-icons/fi";
import { FaLocationDot } from "react-icons/fa6";
import { AiOutlineFieldTime } from "react-icons/ai";
import { MdPeople } from "react-icons/md";
import { MdAirlineSeatReclineNormal } from "react-icons/md";
import PencilNoteIcon from "@/components/icons/PencilNoteIcon";
import ViewAttendance_Modal from "@/components/ViewAttendance_Modal";
import useViewModeStore from '@/components/zustand/viewModeStorage';
import cookie from 'js-cookie';
import { useRouter } from "next/navigation";
import ChartDataLabels from 'chartjs-plugin-datalabels';
//npm install chartjs-plugin-datalabels

// import {Calendar} from "@/components/layouts/calendar";

const currentDate = new Date();
const formattedDate = currentDate.toLocaleDateString("en-US", {
	weekday: "long",
	year: "numeric",
	month: "long",
	day: "numeric",
});

const formatDate = (dateString: string): string => {
	const options: Intl.DateTimeFormatOptions = {
		weekday: "long",
		year: "numeric",
		month: "long",
		day: "numeric",
	};
	return new Date(dateString).toLocaleDateString("en-US", options);
};

const formatTime = (timeString: string): string => {
	const options: Intl.DateTimeFormatOptions = {
		hour: "numeric",
		minute: "numeric",
		hour12: true,
	};
	const formattedTime = new Date(`2000-01-01T${timeString}`).toLocaleTimeString(
		"en-US",
		options,
	);

	// Convert to lowercase and remove the space
	return formattedTime.replace(" ", "").toLowerCase();
};

// type Info = {
// 	intFID: string;
// 	intFEventName: string;
// 	intFDescription: string;
// 	intFVenue: string;
// 	intFMaximumSeats: string;
// 	intFStartDate: string;
// 	intFStartTime: string;
// 	intFEndTime: string;
// 	intFOrganizer: string;
// 	intFFaculty: string;
// };

type mainEvent = {
	intFID: string;
	intFEventName: string;
	intFEventDescription: string;
	intFEventStartDate: string;
	intFEventEndDate: string;
};

type AttendanceDataType = {
	attFormsID: string;
	attFSubEventID: string;
	attFormsStaffID: string;
	attFormsStaffName: string;
	attFormsFacultyUnit: string;
};

type subEvents = {
	sub_eventsID: string;
	sub_eventsMainID: string;
	sub_eventsName: string;
	sub_eventsVenue: string;
	sub_eventsStartDate: string;
	sub_eventsEndDate: string;
	sub_eventsStartTime: string;
	sub_eventsEndTime: string;
	sub_eventsOrganizer: string;
	sub_eventsFaculty: string;
	sub_eventsMaxSeats: string;
}

export default function Homepage() {
	const supabase = createClientComponentClient();
	const malaysiaTimezone = "Asia/Kuala_Lumpur";

	// const [info, setInfo] = useState<Info>({} as Info);
	// const [infos, setInfos] = useState<Info[]>([] as Info[]);

	const [mainEvent, setMainEvent] = useState<mainEvent>({} as mainEvent);
	const [mainEvents, setMainEvents] = useState<mainEvent[]>([] as mainEvent[]);

	// const [latestEvent, setLatestEvent] = useState<Info | null>(null);
	const [latestEvent, setLatestEvent] = useState<mainEvent[]>([]);

	const [numberOfAttendees, setNumberOfAttendees] = useState<number>(0);
	const [selectedEvent, setSelectedEvent] = useState({
		intFID: "",
		intFEventName: "",
		intFEventDescription: "",
		intFEventStartDate: "",
		intFEventEndDate: "",
		sub_eventsID: "",
		sub_eventsMainID: "",
		sub_eventsName: "",
		sub_eventsVenue: "",
		sub_eventsStartDate: "",
		sub_eventsEndDate: "",
		sub_eventsStartTime: "",
		sub_eventsEndTime: "",
		sub_eventsMaxSeats: "",
		sub_eventsOrganizer: "",
		sub_eventsFaculty: "",
	});

	const [editEventInfo, setEditEventInfo] = useState({
		intFID: "",
		intFEventName: "",
		intFDescription: "",
		intFStartDate: "",
		intFStartTime: "",
		intFEndTime: "",
		intFVenue: "",
		intFMaximumSeats: "",
		intFOrganizer: "",
		intFFaculty: "",
	});

	// Create, View, Edit Modal + Selected Event Image
	const [showModalCreateEvent, setShowModalCreateEvent] = useState(false);
	const [showModalViewEvent, setShowModalViewEvent] = useState(false);
	const [showModalEditEvent, setShowModalEditEvent] = useState(false);
	const [selectedEventImage, setSelectedEventImage] = useState("");
	const [subEvents, setSubEvents] = useState<subEvents[]>([]);



	// Success Modal and Confirmation Modal
	const [showModalSuccess, setShowModalSuccess] = useState(false);
	const [showModalConfirmation, setShowModalConfirmation] = useState(false);

	// This is for attendance modal,
	const [attendanceData, setAttendanceData] = useState<AttendanceDataType[]>([]);
	const [showAttendanceModal, setShowAttendanceModal] = useState(false);
	const [attendanceMainEventID, setAttendanceMainEventID] = useState("");

	// This is for the pie chart,
	const [selectedSubEvent, setSelectedSubEvent] = useState<string>("");
	const chartContainer = useRef<HTMLCanvasElement | null>(null);
	const chartInstanceRef = useRef<Chart<"pie", number[], string> | null>(null);
	const [isAllButtonActive, setIsAllButtonActive] = useState(true);
	const viewMode = useViewModeStore((state) => state.viewMode);


	// This is for checking login and redirecting with router,
	const router = useRouter();

	// Function to fetch the 6 latest events
	useEffect(() => {
		const fetchLatestEvent = async () => {
			// Fetch data from internal_events table
			const { data: mainEventData, error: internalError } = await supabase
				.from("internal_events")
				.select(
					"intFID, intFEventName, intFEventDescription, intFEventStartDate, intFEventEndDate",
				)
				.gte(
					"intFEventStartDate",
					new Date().toLocaleString("en-US", { timeZone: malaysiaTimezone }),
				)
				.order("intFEventStartDate", { ascending: true })
				.range(0, 5)
				.select();

			if (internalError) {
				console.error("Error fetching latest event:", internalError);
				return;
			}

			setLatestEvent(mainEventData);

			// Fetch data from sub_events table where sub_eventsMainID equals intFID
			const subEventQuery = await supabase
				.from("sub_events")
				.select(
					"sub_eventsID, sub_eventsMainID, sub_eventsName, sub_eventsVenue, sub_eventsMaxSeats, sub_eventsStartDate, sub_eventsEndDate, sub_eventsStartTime, sub_eventsEndTime, sub_eventsOrganizer, sub_eventsFaculty",
				)
				.in("sub_eventsMainID", mainEventData.map(event => event.intFID));

			if (subEventQuery.error) {
				console.error("Error fetching sub_events:", subEventQuery.error);
				return;
			}

			setSubEvents(subEventQuery.data);
			// console.log("SubEvents:", subEventQuery.data)

			// console.log(
			// 	"Matching Sub Events:",
			// 	subEvents.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[0].intFID)
			// );

		};

		fetchLatestEvent();
	}, [supabase]);

	// useEffect(() => {
	// 	const checkIsUserLoggedIn = () => {
	// 		const authToken = cookie.get('authToken');
	// 		const accountRank = cookie.get('accountRank');
	// 		if (!authToken && accountRank != "99") {
	// 			router.push("/error-404");
	// 		}
	// 	};

	// 	checkIsUserLoggedIn();
	// })

	// This is for attendance modal,

	const openAttendanceModal = async (event_id: string) => {
		// try {
		// 	// Fetch sub-events for the given event
		// 	const { data: subEvents, error: subEventsError } = await supabase
		// 		.from("sub_events")
		// 		.select("sub_eventsID, sub_eventsName")
		// 		.eq("sub_eventsMainID", event_id);

		// 	if (subEventsError) {
		// 		console.error("Error fetching sub_events:", subEventsError);
		// 		return;
		// 	}
		// 	setAttendanceMainEventID(event_id);
		// 	fetchAttendanceList(event_id)
		// 	setSubEvents(subEvents);

		// 	// Extract the subEventID values from the fetched sub_events
		// 	const subEventIDs = subEvents.map((subEvent) => subEvent.sub_eventsID);

		// 	// Fetch all attendance_forms related to those sub_events
		// 	const { data: attendanceForms, error: formsError } = await supabase
		// 		.from("attendance_forms")
		// 		.select()
		// 		.in("attFSubEventID", subEventIDs);

		// 	if (formsError) {
		// 		console.error("Error fetching attendance forms:", formsError);
		// 		return;
		// 	}

		// 	// Set the attendance data for the main event
		// 	setAttendanceData(attendanceForms);
		// 	setSelectedEvent({
		// 		intFID: event_id,
		// 		intFName: "",
		// 		intFDescription: "",
		// 		intFStartDate: "",
		// 		intFStartTime: "",
		// 		intFEndTime: "",
		// 		intFVenue: "",
		// 		intFMaximumSeats: "",
		// 		intFOrganizer: "",
		// 		intFFaculty: "",
		// 	});

		// 	console.log("Attendance forms data:", attendanceForms);
		// } catch (error) {
		// 	const typedError = error as Error;
		// 	console.error("Error:", typedError.message);
		// }

		// setShowAttendanceModal(true);
	};

	const handleSubEventClick = async (subEvent: subEvents) => {
		try {
			// Fetch attendance data for the selected sub-event
			setSelectedSubEvent(subEvent.sub_eventsID);
			const { data: attendanceForms, error: formsError } = await supabase
				.from("attendance_forms")
				.select()
				.eq("attFSubEventID", subEvent.sub_eventsID);

			if (formsError) {
				console.error("Error fetching attendance forms:", formsError);
				return;
			}

			// Set the attendance data for the selected sub-event
			setAttendanceData(attendanceForms);

			// Calculate labels (faculty/unit) and label data (counts)
			const facultyCounts: { [key: string]: number } = {};

			attendanceForms.forEach(attendanceItem => {
				const faculty = attendanceItem.attFormsFacultyUnit;
				if (facultyCounts[faculty]) {
					facultyCounts[faculty]++;
				} else {
					facultyCounts[faculty] = 1;
				}
			});

			const facultyLabels = Object.keys(facultyCounts);
			const facultyData = facultyLabels.map(label => facultyCounts[label]);

			const canvas = chartContainer.current;
			createPieChart(canvas, facultyLabels, facultyData);

			console.log("Attendance forms data for selected sub-event:", attendanceForms);
		} catch (error) {
			const typedError = error as Error;
			console.error("Error:", typedError.message);
		}
	};

	const fetchAttendanceList = async (event_id: string) => {
		const { data: subEvents, error: subEventsError } = await supabase
			.from("sub_events")
			.select()
			.eq("sub_eventsMainID", event_id);

		if (subEventsError) {
			console.error("Error fetching sub_events:", subEventsError);
			return;
		}

		// Extract the subEventID values from the fetched sub_events
		const subEventIDs = subEvents.map(subEvent => subEvent.sub_eventsID);

		// Now, fetch the attendance_forms related to those sub_events
		const { data: attendanceForms, error: formsError } = await supabase
			.from("attendance_forms")
			.select()
			.in("attFSubEventID", subEventIDs);

		if (formsError) {
			console.error("Error fetching attendance forms:", formsError);
			return;
		} else {
			setAttendanceData(attendanceForms);
			setSelectedSubEvent("");

			const facultyCounts: { [key: string]: number } = {};

			attendanceForms.forEach(attendanceItem => {
				const faculty = attendanceItem.attFormsFacultyUnit;
				if (facultyCounts[faculty]) {
					facultyCounts[faculty]++;
				} else {
					facultyCounts[faculty] = 1;
				}
			});

			const facultyLabels = Object.keys(facultyCounts);
			const facultyData = facultyLabels.map(label => facultyCounts[label]);

			const canvas = chartContainer.current;
			createPieChart(canvas, facultyLabels, facultyData);
		}
	}

	// Pie chart,
	const createPieChart = (
		chartContainer: HTMLCanvasElement | null,
		labels: string[],
		data: number[]) => {
		if (chartContainer) {
			const ctx = chartContainer.getContext('2d');

			if (ctx) {
				if (chartInstanceRef.current) {
					chartInstanceRef.current.destroy();
				}

				Chart.register(ChartDataLabels);

				chartInstanceRef.current = new Chart(ctx, {
					type: 'pie',
					data: {
						labels: labels,
						datasets: [
							{
								data: data,
								backgroundColor: [
									'red',
									'blue',
									'green',
									'orange',
									'purple',
									'pink',
									'yellow',
									'teal',
									'brown',
									'cyan',
									'lime',
									'indigo',
									'violet',
									'magenta',
									'amber',
									'lightblue',
									'deeporange',
									'lightgreen',
									'bluegrey',
								],
							},
						],
					},
					options: {
						responsive: true,
						maintainAspectRatio: false,
						plugins: {
							legend: {
								position: 'bottom',
							},
							datalabels: {
								color: '#000000',
								font: {
									weight: 'bold'
								},
								formatter: (value: number, context: any) => {
									const total = context.dataset.data.reduce((acc: number, current: number) => acc + current, 0);
									const percentage = ((value / total) * 100).toFixed(2);

									return `${percentage}%\n(${value}/${total})`;
								},
							},
						},
					},
				});
			}
		}
	};

	const openModal = async (
		imageSrc: string,
		event_id: string,
		event_name: string,
		event_description: string,
		event_start_date: string,
		event_end_date: string,
		sub_event_id: string,
		sub_eventMain_id: string,
		sub_event_name: string,
		sub_event_venue: string,
		sub_event_start_date: string,
		sub_event_end_date: string,
		sub_event_start_time: string,
		sub_event_end_time: string,
		sub_event_maximum_seats: string,
		sub_event_organizer: string,
		sub_event_faculty: string,
	) => {
		setSelectedEventImage(imageSrc);
		setSelectedEvent({
			intFID: event_id,
			intFEventName: event_name,
			intFEventDescription: event_description,
			intFEventStartDate: event_start_date,
			intFEventEndDate: event_end_date,
			sub_eventsID: sub_event_id,
			sub_eventsMainID: sub_eventMain_id,
			sub_eventsName: sub_event_name,
			sub_eventsVenue: sub_event_venue,
			sub_eventsStartDate: sub_event_start_date,
			sub_eventsEndDate: sub_event_end_date,
			sub_eventsStartTime: sub_event_start_time,
			sub_eventsEndTime: sub_event_end_time,
			sub_eventsMaxSeats: sub_event_maximum_seats,
			sub_eventsOrganizer: sub_event_organizer,
			sub_eventsFaculty: sub_event_faculty,
		});

		// Fetch the attendance list for that event,
		fetchAttendanceList(event_id);

		setShowModalViewEvent(true);
	};


	// Create event + sub events dynamic textbox
	const [eventDetails, setEventDetails] = useState([
		{ event_names: [''], venues: [''], start_dates: [''], end_dates: [''], start_times: [''], end_times: [''], maximum_seats: [''], organizers: [''], faculties: [''] },
	]);

	const addEventDetails = () => {
		setEventDetails([...eventDetails, { event_names: [''], venues: [''], start_dates: [''], end_dates: [''], start_times: [''], end_times: [''], maximum_seats: [''], organizers: [''], faculties: [''] }]);
	};

	const handleEventNameInputChange = (eventIndex: number, eventNameIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].event_names[eventNameIndex] = value;
		setEventDetails(updatedDetails);
	};

	const handleEventVenueInputChange = (eventIndex: number, venueIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].venues[venueIndex] = value;
		setEventDetails(updatedDetails);
	};

	const handleEventStartDatesInputChange = (eventIndex: number, startDatesIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].start_dates[startDatesIndex] = value;
		setEventDetails(updatedDetails);
	};

	const handleEventEndDatesInputChange = (eventIndex: number, endDatesIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].end_dates[endDatesIndex] = value;
		setEventDetails(updatedDetails);
	};

	const handleEventStartTimesInputChange = (eventIndex: number, startTimesIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].start_times[startTimesIndex] = value;
		setEventDetails(updatedDetails);
	};

	const handleEventEndTimesInputChange = (eventIndex: number, endTimesIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].end_times[endTimesIndex] = value;
		setEventDetails(updatedDetails);
	};

	const handleEventMaximumSeatsInputChange = (eventIndex: number, maximumSeatsIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].maximum_seats[maximumSeatsIndex] = value;
		setEventDetails(updatedDetails);
	};

	const handleEventOrganizersInputChange = (eventIndex: number, organizersIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].organizers[organizersIndex] = value;
		setEventDetails(updatedDetails);
	};

	const handleEventFacultiesInputChange = (eventIndex: number, facultiesIndex: number, value: string) => {
		const updatedDetails = [...eventDetails];
		updatedDetails[eventIndex].faculties[facultiesIndex] = value;
		setEventDetails(updatedDetails);
	};


	// Handle data submission
	const handleSubmitCreateEvent = async (e: SyntheticEvent) => {
		e.preventDefault();
		console.log(eventDetails);

		// MAIN EVENT
		const { data, error } = await supabase
			.from("internal_events")
			.upsert({
				intFEventName: mainEvent.intFEventName,
				intFEventDescription: mainEvent.intFEventDescription,
				intFEventStartDate: mainEvent.intFEventStartDate,
				intFEventEndDate: mainEvent.intFEventEndDate,
			})
			.select();

		console.log("DATA"+ data);

		// // This attendance list will be created x times based on how many days (sub-events spread out across multiple days), x the event has.
		// if (error) {
		// 	console.error("Error inserting event data:", error);
		// } else {
		// 	// Extract the generated UUID from the event data
		// 	const generatedEventID = data[0].intFID;

		// 	const { data: attendanceData, error: attendanceError } = await supabase
		// 		.from("attendance_list")
		// 		.upsert({
		// 			attListEventID: generatedEventID,
		// 			attListDayCount: 0,
		// 			attListEventDate: info.intFStartDate,
		// 		});

		// 	if (attendanceError) {
		// 		console.error("Error inserting attendance data:", attendanceError);
		// 	} else {
		// 		console.log("Attendance data inserted successfully:", attendanceData);
		// 	}
		// }

		// if (error) {
		// 	console.error(error);
		// 	return;
		// }

		setMainEvents([
			...mainEvents,
			{
				intFID: mainEvent.intFID,
				intFEventName: mainEvent.intFEventName,
				intFEventDescription: mainEvent.intFEventDescription,
				intFEventStartDate: mainEvent.intFEventStartDate,
				intFEventEndDate: mainEvent.intFEventEndDate,
			},
		]);

		setMainEvent({} as mainEvent);


		// { event_names: [''], venues: [''], maximum_seats: [''], start_dates: [''], end_dates: [''], start_times: [''], end_times: [''], organizers: [''], faculties: [''] },
		// SUB EVENTS

		// THIS IS THE OLD ONE WITH RED RED
		for (const [index, detail] of eventDetails.entries()) {
			for (let i = 0; i < detail.venues.length; i++) {
				console.log("Index: " + index)
				console.log("Length" + detail.venues.length)
 
				const sub_eventsName = detail.event_names[i];
				const sub_eventsVenue = detail.venues[i];
				const sub_eventsStartDate = detail.start_dates[i];
				const sub_eventsEndDate = detail.end_dates[i];
				const sub_eventsStartTime = detail.start_times[i];
				const sub_eventsEndTime = detail.end_times[i];
				const sub_eventsMaxSeats = detail.maximum_seats[i];
				const sub_eventsOrganizer = detail.organizers[i];
				const sub_eventsFaculty = detail.faculties[i];

				const { data: subEventData, error: subEventError } = await supabase.from("sub_events").insert({
					sub_eventsMainID: mainEvent.intFID,
					sub_eventsName,
					sub_eventsVenue,
					sub_eventsStartDate,
					sub_eventsEndDate,
					sub_eventsStartTime,
					sub_eventsEndTime,
					sub_eventsMaxSeats,
					sub_eventsOrganizer,
					sub_eventsFaculty,
				});

				if (subEventError) {
					console.error(subEventError);
					return;
				}

				if (subEventData && subEventData.length > 0) {
					setSubEvents(prevSubEvents => [...prevSubEvents, subEventData[0]]);
				}
			}
		}

	};

	// const handleEditEventButton = (e: React.MouseEvent<HTMLButtonElement>) => {
	// 	e.preventDefault();
	// 	setShowModalEditEvent(true);
	// 	setShowModalViewEvent(false);

	// 	// Check if selectedEvent has a value
	// 	if (selectedEvent) {
	// 		setShowModalEditEvent(true);
	// 		setShowModalViewEvent(false);

	// 		setEditEventInfo({
	// 			intFID: selectedEvent.intFID,
	// 			intFEventName: selectedEvent.intFName,
	// 			intFDescription: selectedEvent.intFDescription,
	// 			intFStartDate: selectedEvent.intFStartDate,
	// 			intFStartTime: selectedEvent.intFStartTime,
	// 			intFEndTime: selectedEvent.intFEndTime,
	// 			intFVenue: selectedEvent.intFVenue,
	// 			intFMaximumSeats: selectedEvent.intFMaximumSeats,
	// 			intFOrganizer: selectedEvent.intFOrganizer,
	// 			intFFaculty: selectedEvent.intFFaculty,
	// 		});
	// 		console.log("testing edit");
	// 		console.log(selectedEvent.intFName);
	// 		console.log(selectedEvent.intFOrganizer);
	// 	}
	// };

	// const handleEditEventSubmit = async (e: React.FormEvent) => {
	// 	e.preventDefault();

	// 	const { data, error } = await supabase
	// 		.from("internal_events")
	// 		.update({
	// 			intFEventName: editEventInfo.intFEventName,
	// 			intFDescription: editEventInfo.intFDescription,
	// 			intFStartDate: editEventInfo.intFStartDate,
	// 			intFStartTime: editEventInfo.intFStartTime,
	// 			intFEndTime: editEventInfo.intFEndTime,
	// 			intFVenue: editEventInfo.intFVenue,
	// 			intFMaximumSeats: editEventInfo.intFMaximumSeats,
	// 			intFOrganizer: editEventInfo.intFOrganizer,
	// 			intFFaculty: editEventInfo.intFFaculty,
	// 		})
	// 		.eq("intFID", editEventInfo.intFID);

	// 	if (error) {
	// 		console.error("Error updating event:", error);
	// 		return;
	// 	}

	// 	setShowModalSuccess(true);
	// };

	const handleOK = () => {
		setShowModalSuccess(false);
		window.location.reload();
	};

	const handleCancel = () => {
		setShowModalConfirmation(false);
	};

	// TODO: TEST WHETHER DELETE EVENT WORKS, INTFID CHANGED FROM NUMBER TO STRING.
	// const handleDeleteEvent = async (intFID: string) => {
	// 	const { data, error } = await supabase
	// 		.from("internal_events")
	// 		.delete()
	// 		.eq("intFID", intFID);

	// 	if (error) {
	// 		console.error("Error deleting event:", error);
	// 		return;
	// 	}

	// 	console.log("Event deleted successfully:", data);

	// 	window.location.reload();
	// };

	return (
		<div className="p-5 bg-slate-100 space-y-4">
			<div className="mx-auto w-full">
				<div className="w-full flex ml-1">
					<div className="lg:flex bg-white border border-slate-200 rounded-lg hidden p-5 gap-4 w-full">
						<div className="w-1/3 text-left h-full">
							<div className="bg-[#E5F9FF] p-5 text-slate-700 rounded-lg flex">
								<div className="mr-4">
									<FontAwesomeIcon
										icon={faCalendar}
										className="w-8 mt-[6.5px] text-slate-700"
										size="2x"
									/>
								</div>
								<div className="ml-1">
									<p className="text-[15px]">Today&apos;s Date</p>
									<p className="font-medium">{formattedDate}</p>
								</div>
							</div>
						</div>

						<div className="w-1/3 h-full text-left transition transform hover:scale-105">
							<a
								href="/upcomingEvents"
								className="bg-[#FFEDE5] h-full p-5 text-slate-700 rounded-lg flex hover:bg-[#ffdcce]">
								<div className="mr-4">
									<FontAwesomeIcon
										icon={faUsers}
										className="w-8 mt-[6px] text-slate-700"
										size="2x"
									/>
								</div>
								<div className="ml-1">
									<p className="text-[15px]">Upcoming Events</p>
									<p className="font-medium">2</p>
								</div>
							</a>
						</div>

						<div className="w-1/3 text-left h-full transition transform hover:scale-105">
							<a
								href="/pastEvents"
								className="bg-[#EAE5FF] p-5 h-full text-slate-700 rounded-lg flex hover:bg-[#e0d8ff]">
								<div className="mr-4">
									<FontAwesomeIcon
										icon={faCheckCircle}
										className="w-[34px] mt-[6px] text-slate-700"
										size="2x"
									/>
								</div>
								<div className="ml-1">
									<p className="text-[15px]">Past Events</p>
									<p className="font-medium">2</p>
								</div>
							</a>
						</div>
					</div>

					<div className="w-1/4 mt-4 flex justify-end items-start lg:mr-1 lg:ml-5">
						<button
							className="flex items-center bg-slate-800 rounded-lg py-3 px-[50px] lg:px-[30px] font-medium hover:bg-slate-900 focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 shadow-sm mt-4 -mr-[15px] hover:text-slate-50 justify-end text-right hover:transition duration-300 transform hover:scale-105 cursor-pointer"
							onClick={() => setShowModalCreateEvent(true)}>
							<IoIosAddCircleOutline className="text-3xl text-slate-100 -ml-1 mr-1" />
							<span className="text-slate-100 ml-1">Add Events</span>
						</button>
					</div>

					<CreateEvent_Modal isVisible={showModalCreateEvent}
						onClose={() => setShowModalCreateEvent(false)}>
						<form onSubmit={handleSubmitCreateEvent}>
							<div className="ml-[7px] lg:ml-4 mb-[70px]">
								<h3 className="text-[15px] lg:text-[16px] lg:text-lg font-semibold text-slate-700 mb-[6px] lg:mb-2 mt-[9px]">
									Create Event
								</h3>

								<hr className="border-t-2 border-slate-200 my-4 w-[285px] lg:w-[505px]" />

								<div>
									<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 ml-[2px]">
										Event Name
										<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
											*
										</span>
									</p>
									<input
										className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px] text-[12px] text-left"
										type="text"
										placeholder="Event name"
										id="event_name"
										name="event_name"
										required
										onChange={e =>
											setMainEvent({
												...mainEvent,
												intFEventName: e.target.value,
											})
										}
									/>

									<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[2px]">
										Description
										<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
											*
										</span>
									</p>
									<input
										className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
										type="text"
										placeholder="Description"
										name="event_description"
										required
										onChange={e =>
											setMainEvent({
												...mainEvent,
												intFEventDescription: e.target.value,
											})
										}
									/>

									<div className="flex flex-col mt-[10px]">
										<div className="flex">
											<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 mr-[85px] ml-[2px] mb-[2px]">
												Start Date
												<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
													*
												</span>
											</p>
											<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 mr-[85px] ml-[10px] mb-[2px]">
												End Date
												<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
													*
												</span>
											</p>
										</div>
										<div className="flex">
											<input
												className="lg:pr-[8px] lg:py-2 pl-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm text-slate-500 focus:outline-none focus:border-gray-400 focus:bg-white mr-[90.5px] mb-[3px] py-[5px]"
												type="date"
												name="event_start_date"
												required
												onChange={e =>
													setMainEvent({
														...mainEvent,
														intFEventStartDate: e.target.value,
													})
												}
											/>
											<input
												className="rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm text-slate-500 focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px] pl-2 lg:pl-3 -ml-[71.5px] pr-2 py-[5px]"
												type="date"
												name="event_end_date"
												required
												onChange={e =>
													setMainEvent({
														...mainEvent,
														intFEventEndDate: e.target.value,
													})
												}
											/>

										</div>
									</div>

								</div>

								{eventDetails.map((detail, index) => (
									<div key={index} className="mb-7">
										<p className="text-[15px] lg:text-[17px] font-semibold text-slate-700 lg:mb-2 mt-5">‣ Session {index + 1}</p>

										{detail.event_names.map((event_name, eventNameIndex) => (
											<div key={eventNameIndex}>
												<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[2px]">
													Event Name
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">*</span>
												</p>
												<input
													type="text"
													placeholder="Event name"
													value={event_name}
													onChange={(e) => handleEventNameInputChange(index, eventNameIndex, e.target.value)}
													className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
													required
												/>
											</div>
										))}

										{detail.venues.map((venue, venueIndex) => (
											<div key={venueIndex}>
												<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[2px]">
													Venue
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">*</span>
												</p>
												<input
													type="text"
													placeholder="Venue"
													value={venue}
													onChange={(e) => handleEventVenueInputChange(index, venueIndex, e.target.value)}
													className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
													required
												/>
											</div>
										))}

										{detail.maximum_seats.map((maximum_seats, maximumSeatsIndex) => (
											<div key={maximumSeatsIndex}>
												<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[1px]">
													Maximum Seats
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">*</span>
												</p>
												<input
													type="text"
													placeholder="Maximum seats"
													value={maximum_seats}
													onChange={(e) => handleEventMaximumSeatsInputChange(index, maximumSeatsIndex, e.target.value)}
													className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
													required
												/>
											</div>
										))}

										<div className="flex flex-col mt-[10px]">
											<div className="flex">
												<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 mr-[85px] ml-[1px] mb-[2px]">
													Start Date
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
														*
													</span>
												</p>
												<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 mr-[85px] ml-[9px] mb-[2px]">
													End Date
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
														*
													</span>
												</p>
											</div>
											<div className="flex">
												{detail.start_dates.map((start_dates, startDatesIndex) => (
													<div key={startDatesIndex}>
														<input
															className="lg:pr-[8px] py-[5px] pl-2 lg:py-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm text-slate-500 focus:outline-none focus:border-gray-400 focus:bg-white mr-[90.5px] mb-[3px]"
															type="date"
															name="event_start_date"

															onChange={(e) => handleEventStartDatesInputChange(index, startDatesIndex, e.target.value)}
															required
														/>
													</div>
												))}

												{detail.end_dates.map((end_dates, endDatesIndex) => (
													<div key={endDatesIndex}>
														<input
															className="rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm text-slate-500 focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px] py-[5px] pl-2 -ml-[71.5px] pr-2 lg:py-2"
															type="date"
															name="event_end_date"

															onChange={(e) => handleEventEndDatesInputChange(index, endDatesIndex, e.target.value)}
															required
														/>
													</div>
												))}
											</div>
										</div>

										<div className="flex flex-col mt-[10px]">
											<div className="flex">
												<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 mb-[2px] ml-[1px]">
													Start Time
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
														*
													</span>
												</p>
												<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 ml-[38.5px] mb-[2px]">
													End Time
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
														*
													</span>
												</p>
											</div>
											<div className="flex">
												{detail.start_times.map((start_times, startTimesIndex) => (
													<div key={startTimesIndex}>
														<input
															className="lg:pr-2 lg:py-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm text-slate-500 focus:outline-none focus:border-gray-400 focus:bg-white lg:mr-[91.5px] mb-[3px]"
															type="time"
															name="event_start_time"

															onChange={(e) => handleEventStartTimesInputChange(index, startTimesIndex, e.target.value)}
															required
														/>
													</div>
												))}

												{detail.end_times.map((end_times, endTimesIndex) => (
													<div key={endTimesIndex}>
														<input
															className="lg:pr-2 lg:py-2 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm text-slate-500 focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px] pl-3 -ml-[71.5px] pr-2 "
															type="time"
															name="event_end_time"

															onChange={(e) => handleEventEndTimesInputChange(index, endTimesIndex, e.target.value)}
															required
														/>
													</div>
												))}

											</div>
										</div>

										{detail.organizers.map((organizers, organizersIndex) => (
											<div key={organizersIndex}>
												<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[2px]">
													Organizer
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">*</span>
												</p>
												<input
													type="text"
													placeholder="Organizer"
													value={organizers}
													onChange={(e) => handleEventOrganizersInputChange(index, organizersIndex, e.target.value)}
													className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
													required
												/>
											</div>
										))}

										{detail.faculties.map((faculties, facultiesIndex) => (
											<div key={facultiesIndex}>
												<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[2px]">
													Faculty
													<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">*</span>
												</p>
												<input
													type="text"
													placeholder="Faculty"
													value={faculties}
													onChange={(e) => handleEventFacultiesInputChange(index, facultiesIndex, e.target.value)}
													className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
													required
												/>
											</div>
										))}
									</div>
								))}

								<div className="absolute bottom-0 left-0 right-0 p-4 bg-white flex justify-center gap-[2px]">
									<button type="button" onClick={addEventDetails} className="rounded-lg px-[7px] py-[5px] lg:px-[10px] lg:py-[5px] border border-slate-800 hover:bg-slate-100 mr-4 text-[12px] lg:text-[15px] focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 font-medium">
										Add SubEvent
									</button>

									<button
										className="rounded-lg px-[32px] py-[8px] lg:px-[37px] lg:py-[9px]  bg-slate-800 text-slate-100 text-[13px] lg:text-[15px] hover:bg-slate-900 focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
									// onClick={() => {
									// 	if (
									// 		mainEvent.intFEventName &&
									// 		mainEvent.intFEventDescription &&
									// 		mainEvent.intFEventStartDate &&
									// 		mainEvent.intFEventEndDate
									// 	) {
									// 		setShowModalSuccess(true);
									// 	}
									// }}
									>
										Submit
									</button>
								</div>
							</div>
						</form>
					</CreateEvent_Modal>

					<ViewEvent_Modal
						isVisible={showModalViewEvent}
						onClose={() => setShowModalViewEvent(false)}>
						<div className="py-[30px] lg:py-[100px] relative">
							<img
								src={selectedEventImage}
								alt="Random"
								className="absolute h-[200px] lg:h-[258px] object-cover -mt-[38px] lg:-mt-[100px] rounded-t-lg -ml-[0.25px] lg:ml-2 transform hover:scale-110 hover:rotate-1 scale-[1.063] lg:scale-[1.070] transition duration-300 shadow-sm"
							/>

							<div className="ml-[7px] lg:ml-[9px]">
								<h3 className="text-[16px] lg:text-[19px] font-semibold text-slate-800 mb-1 mt-[180px]">
									About this event
								</h3>
								<p className="text-[12px] lg:text-[14px] text-mb-7 -mb-1 lg:mb-5 font-normal text-slate-500 mt-[10px]">
									{selectedEvent.intFEventDescription}
								</p>

								<div className="flex items-center mt-4">
									<HiMiniCalendarDays className="text-[32px] lg:text-2xl mr-2 text-slate-800 -mt-[2px]" />
									<p className="text-slate-600 text-[12px] lg:text-[13px] ml-[1px] mt-[0.5px]">
										{formatDate(selectedEvent.intFEventStartDate)}
									</p>
									<span className="mx-2 text-slate-800 ml-[15px] lg:ml-[57px] mr-6">
										|
									</span>
									<FiClock className="text-[30px] lg:text-[21px] mr-2 text-slate-800 -mt-[1px]" />
									<p className="text-slate-600 text-[12px] lg:text-[13px]">
										{formatTime(selectedEvent.sub_eventsStartTime)}
									</p>
									<span className="mx-2 text-slate-800 -mt-[2px]">
										-
									</span>
									<p className="text-slate-600 text-[12px] lg:text-[13px]">
										{formatTime(selectedEvent.sub_eventsEndTime)}
									</p>
								</div>
								<div className="flex items-center mt-[10px] lg:mt-[14px]">
									<FaLocationDot className="text-xl lg:text-2xl -ml-[0.5px] lg:ml-0 mr-2 text-slate-800" />
									<p className="text-slate-600 text-[12px] lg:text-[13px] ml-[1px]">
										{selectedEvent.sub_eventsVenue}
									</p>
								</div>
								<div className="flex items-center mt-[11px] lg:mt-[14px]">
									<MdPeople className="text-2xl mr-2 text-slate-800 -ml-[1px] lg:ml-[1px]" />
									<p className="text-slate-600 text-[12px] lg:text-[13px] mt-[1px] -ml-[2px] lg:ml-0">
										{numberOfAttendees} Attendees
									</p>
								</div>
								<div className="flex items-center mt-[15px] lg:mb-0 mb-[3px]">
									<MdAirlineSeatReclineNormal className="text-2xl mr-2 text-slate-800 lg:ml-[2px]" />
									<p className="text-slate-600 text-[12px] lg:text-[13px] mt-[1px] lg:-ml-[1px]">
										{selectedEvent.sub_eventsMaxSeats} Seats
									</p>
								</div>

								<div className="absolute bottom-0 left-0 right-0 p-4 bg-white">
									<div className="flex justify-center">
										<button
											className="rounded-lg px-[7px] py-[5px] lg:px-[10px] lg:py-[5px] border border-slate-800 hover:bg-slate-100 mr-4 text-[12px] lg:text-[15px] focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 font-medium"
											onClick={() =>
												setShowModalConfirmation(true)
											}>
											Cancel Event
										</button>

										<button
											className="rounded-lg px-[20px] py-[6px] lg:px-[25px] lg:py-[9px] bg-slate-800 text-slate-100 text-[12px] lg:text-[15px] hover:bg-slate-900 focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
										// onClick={handleEditEventButton}
										>
											Edit Event
										</button>
									</div>
								</div>
							</div>
						</div>
					</ViewEvent_Modal>

					<ViewAttendance_Modal
						isVisible={showAttendanceModal}
						onClose={() => setShowAttendanceModal(false)}>
						<div className="flex">
							<div className={`w-${attendanceData && attendanceData.length > 0 ? '1/2' : 'full'} h-[700px]`}>
								<div className="flex items-center justify-center">
									<div className="flex items-center justify-center text-text text-[20px] text-center -mt-8">
										<PencilNoteIcon />{" "}
										<span className="ml-2.5">Attendance List</span>
									</div>
									<div className="ml-auto">
										<Link
											href={`/attendance/${selectedEvent.intFID}`}
											passHref
											legacyBehavior={true}>
											<a className="flex items-center bg-slate-200 rounded-lg text-[15px] hover:bg-slate-300 focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-sm mb-3.5">
												<span className="text-slate-800 p-[5px]">
													View More
												</span>
											</a>
										</Link>
									</div>
								</div>
								<div className="text-left text-black text-[13px] pl-9 pb-5 -mt-[28px]">
									Total Attendees: {attendanceData.length}
								</div>
								<div className="flex flex-wrap">
									<button
										className={`font-bold flex items-center rounded-lg text-[15px] hover:bg-red-200 focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-sm mb-3.5 pt-2 pb-2 pl-3 pr-3 ${isAllButtonActive ? 'bg-red-400 text-white' : 'bg-slate-200 text-slate-800'
											}`}
										onClick={() => {
											setIsAllButtonActive(true);
											fetchAttendanceList(attendanceMainEventID);
										}}
									>
										All
									</button>
									{subEvents.map((subEvent) => (
										<div
											key={subEvent.sub_eventsID}
											className={`font-bold flex items-center bg-slate-200 rounded-lg text-[15px] hover:bg-red-200 focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-sm mb-3.5 p-2 ml-3 ${selectedSubEvent === subEvent.sub_eventsID ? 'bg-red-400 text-white' : ''
												}`}
										>
											<button
												onClick={() => {
													setIsAllButtonActive(false);
													handleSubEventClick(subEvent);
												}}
											>
												{subEvent.sub_eventsName}
											</button>
										</div>
									))}
								</div>
								{/* This is to loop through the attendance data. */}
								{attendanceData && attendanceData.length > 0 ? (
									<div className="overflow-y-auto max-h-[600px]">
										<table className="w-full">
											<thead>
												<tr>
													<th className="flex-1 px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider text-center">
														Staff ID
													</th>
													<th className="flex-1 px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
														Staff Name
													</th>
													<th className="flex-1 px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 text-center text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
														Faculty/ Unit
													</th>
												</tr>
											</thead>
											<tbody>
												{attendanceData.map(attendanceItem => (
													<tr key={attendanceItem.attFormsID}>
														<td className="flex-1 px-8 py-5 border-b border-gray-200 bg-white text-sm text-center">
															{attendanceItem.attFormsStaffID}
														</td>
														<td className="flex-1 px-8 py-5 border-b border-gray-200 bg-white text-sm text-center">
															{attendanceItem.attFormsStaffName}
														</td>
														<td className="flex-1 px-8 py-5 border-b border-gray-200 bg-white text-sm text-center">
															{attendanceItem.attFormsFacultyUnit}
														</td>
													</tr>
												))}
											</tbody>
										</table>
									</div>
								) : (
									<div className="text-center text-gray-600 mt-4">
										No attendance data available.
									</div>

								)}
							</div>
							{attendanceData && attendanceData.length > 0 ? (
								<div className="w-1/2 flex flex-col items-center justify-center">
									<div className="text-center font-bold">Number of Attendees Each Faculty/ Unit</div>
									<div className="w-[500px] h-[500px] flex items-center justify-center mt-5">
										<canvas id="attendanceFacultyPieChart" ref={chartContainer} />
									</div>
								</div>
							) : null}
						</div>
					</ViewAttendance_Modal>

					<EditEvent_Modal
						isVisible={showModalEditEvent}
						onClose={() => setShowModalEditEvent(false)}>
						<form>
							<div className="py-[90px] relative">
								<div className="ml-[7px] lg:ml-4">
									<h3 className="text-[15px] lg:text-[16px] lg:text-lg font-semibold text-slate-700 mb-[6px] lg:mb-2 -mt-[80px]">
										Edit Event
									</h3>
									<hr className="border-t-2 border-slate-200 my-4 w-[285px] lg:w-[505px]" />

									<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 ml-[1px]">
										Name
										<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
											*
										</span>
									</p>

									<input
										className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px] text-[12px] text-left"
										type="text"
										placeholder="Event name"
										id="event_name"
										name="event_name"
										value={editEventInfo.intFEventName}
										required
										onChange={e =>
											setEditEventInfo({
												...editEventInfo,
												intFEventName: e.target.value,
											})
										}
									/>

									<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[1px]">
										Description
										<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
											*
										</span>
									</p>
									<input
										className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
										type="text"
										placeholder="Description"
										name="event_description"
										required
										value={editEventInfo.intFDescription}
										onChange={e =>
											setEditEventInfo({
												...editEventInfo,
												intFDescription: e.target.value,
											})
										}
									/>

									<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[1px]">
										Venue
										<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
											*
										</span>
									</p>
									<input
										className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
										type="text"
										placeholder="Venue"
										name="event_venue"
										required
										value={editEventInfo.intFVenue}
										onChange={e =>
											setEditEventInfo({
												...editEventInfo,
												intFVenue: e.target.value,
											})
										}
									/>

									<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[1px]">
										Maximum Seats
										<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
											*
										</span>
									</p>
									<input
										className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
										type="number"
										placeholder="Maximum seats"
										name="event_maximum_seats"
										required
										value={editEventInfo.intFMaximumSeats}
										onChange={e =>
											setEditEventInfo({
												...editEventInfo,
												intFMaximumSeats: e.target.value,
											})
										}
									/>

									<div className="flex flex-col mt-[10px]">
										<div className="flex">
											<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 mr-[85px] lg:mr-[140.5px] ml-[2px] mb-[2px]">
												Date
												<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
													*
												</span>
											</p>
											<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 mr-2 lg:ml-[121px] mb-[2px]">
												Start Time
												<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
													*
												</span>
											</p>
											<p className="text-[12px] lg:text-[14px] text-mb-7 font-normal text-slate-500 mr-2 ml-[10.5px] lg:ml-[26px] mb-[2px]">
												End Time
												<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
													*
												</span>
											</p>
										</div>
										<div className="flex">
											<input
												className="lg:pr-[8px] lg:py-2 lg:pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white lg:mr-[139px] mb-[3px]"
												type="date"
												name="event_date"
												required
												value={editEventInfo.intFStartDate}
												onChange={e =>
													setEditEventInfo({
														...editEventInfo,
														intFStartDate: e.target.value,
													})
												}
											/>
											<input
												className="lg:pr-[8px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white ml-2 mr-[14px] mb-[3px]"
												type="time"
												name="event_start_time"
												required
												value={editEventInfo.intFStartTime}
												onChange={e =>
													setEditEventInfo({
														...editEventInfo,
														intFStartTime: e.target.value,
													})
												}
											/>
											<input
												className="lg:pr-[8px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px] -ml-[6px] lg:ml-0"
												type="time"
												name="event_end_time"
												required
												value={editEventInfo.intFEndTime}
												onChange={e =>
													setEditEventInfo({
														...editEventInfo,
														intFEndTime: e.target.value,
													})
												}
											/>
										</div>
									</div>
									<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[1px]">
										Organizer
										<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
											*
										</span>
									</p>
									<input
										className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white mb-[3px]"
										type="text"
										placeholder="Organizer"
										name="event_organizer"
										required
										value={editEventInfo.intFOrganizer}
										onChange={e =>
											setEditEventInfo({
												...editEventInfo,
												intFOrganizer: e.target.value,
											})
										}
									/>

									<p className="text-[12px] lg:text-[14px] text-mb-7 mb-[2px] font-normal text-slate-500 mt-2 ml-[1px]">
										Faculty
										<span className="text-[12px] lg:text-[14px] text-red-500 ml-[2px]">
											*
										</span>
									</p>
									<input
										className="pr-[106px] lg:pr-[290px] py-[6px] lg:py-2 pl-3 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-[12px] lg:text-sm focus:outline-none focus:border-gray-400 focus:bg-white -mb-[30px]"
										type="text"
										placeholder="Faculty"
										name="event_faculty"
										required
										value={editEventInfo.intFFaculty}
										onChange={e =>
											setEditEventInfo({
												...editEventInfo,
												intFFaculty: e.target.value,
											})
										}
									/>

									<div className="absolute bottom-0 left-0 right-0 p-4 bg-white flex justify-center">
										<button
											className="rounded-lg px-[32px] py-[8px] lg:px-[37px] lg:py-[9px]  bg-slate-800 text-slate-100 text-[13px] lg:text-[15px] hover:bg-slate-900 focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
										// onClick={handleEditEventSubmit}

										>
											Submit
										</button>
									</div>
								</div>
							</div>
						</form>
					</EditEvent_Modal>

					<Success_Modal
						isVisible={showModalSuccess}
						onClose={() => setShowModalSuccess(false)}>
						<div className="p-4">
							<Image
								src="/images/tick_mark.png"
								alt="tick_mark"
								width={200}
								height={250}
								className="-mt-[39px] lg:-mt-[45px] ml-[121.5px]"
							/>
							<h3 className="text-2xl lg:text-3xl font-medium text-gray-600 mb-5 text-center -mt-8">
								Success!
							</h3>
							<p className="text-base text-[14px] lg:text-[16px] lg:text-mb-7 mb-5 lg:mb-5 font-normal text-gray-400 text-center">
								Event has been successfully created!
							</p>
							<div className="text-center ml-4">
								<button
									className="mt-1 text-white bg-slate-800 hover:bg-slate-900 focus:outline-none font-medium text-sm rounded-lg px-16 py-2.5 text-center mr-5 focus:shadow-outline focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
									onClick={handleOK}>
									OK
								</button>
							</div>
						</div>
					</Success_Modal>

					<Delete_Event_Confirmation_Modal
						isVisible={showModalConfirmation}
						onClose={() => setShowModalConfirmation(false)}>
						<div className="p-4">
							<Image
								src="/images/cross_mark.png"
								alt="cross_mark"
								width={210}
								height={250}
								className="ml-[17px] -mt-[45px] lg:-mt-[45px] lg:ml-[115px]"
							/>
							<h3 className="text-2xl lg:text-3xl font-medium text-slate-700 mb-3 text-center -mt-8">
								Are you sure?
							</h3>
							<p className="text-[14px] lg:text-[16px] lg:text-mb-7 mb-5 lg:mb-5 font-normal text-slate-400 text-center">
								Do you really want to cancel this event? This process
								cannot be undone.
							</p>
							<div className="text-center mx-auto">
								<button
									className="text-slate-800 border border-slate-800 hover:bg-slate-100 font-medium text-sm rounded-lg px-[18px] lg:px-5 py-[9px] lg:py-2.5 text-center mr-5 ml-4 focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
									onClick={handleCancel}>
									Cancel
								</button>
								<button
									className="text-slate-100 bg-slate-800 hover:bg-slate-900 font-medium text-sm rounded-lg px-[22px] lg:px-6 py-[10px] lg:py-[11px] text-center mr-5 focus:shadow-outline focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
									onClick={() =>
										handleDeleteEvent(selectedEvent.intFID)
									}>
									Delete
								</button>
							</div>
						</div>
					</Delete_Event_Confirmation_Modal>
				</div>
			</div>

			{viewMode === 1 ? (
				<div className="w-full bg-slate-100 grid lg:grid-cols-[1fr_32%] pb-28 gap-4">
					<div className="grid grid-auto-fit-lg gap-4 ml-1">
						{latestEvent[0] && (
							<div
								className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 h-[495px] w-full relative flex flex-col transition transform hover:scale-105"
								onClick={() => {
									const filteredSubEvent = subEvents.find(subEvent => subEvent.sub_eventsMainID === latestEvent[0].intFID);

									if (filteredSubEvent) {
										openModal(
											"https://source.unsplash.com/600x300?party",
											latestEvent[0]?.intFID,
											latestEvent[0]?.intFEventName,
											latestEvent[0]?.intFEventDescription,
											latestEvent[0]?.intFEventStartDate,
											latestEvent[0]?.intFEventEndDate,
											filteredSubEvent.sub_eventsID,
											filteredSubEvent.sub_eventsMainID,
											filteredSubEvent.sub_eventsName,
											filteredSubEvent.sub_eventsVenue,
											filteredSubEvent.sub_eventsStartDate,
											filteredSubEvent.sub_eventsEndDate,
											filteredSubEvent.sub_eventsStartTime,
											filteredSubEvent.sub_eventsEndTime,
											filteredSubEvent.sub_eventsMaxSeats,
											filteredSubEvent.sub_eventsOrganizer,
											filteredSubEvent.sub_eventsFaculty
										);
									}
								}}>
								<div className="w-full h-[300px] mb-4 relative">
									<div className="absolute -inset-6">
										<img
											src="https://source.unsplash.com/600x300?party"
											alt="Random"
											className="w-full h-full object-cover"
										/>
									</div>
								</div>
								{latestEvent[0] && (
									<div className="mt-6">
										{/* <h2 className="text-2xl font-semibold mb-2 text-slate-800">Event Title</h2> */}
										<h2 className="text-2xl font-semibold mb-2 text-slate-800">
											{latestEvent[0].intFEventName}
										</h2>
										<p className="text-gray-500 mb-4">
											{latestEvent[0].intFEventDescription}
										</p>
										<div className="flex items-center mt-4">
											<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">
												{formatDate(latestEvent[0].intFEventStartDate)}
											</p>
										</div>

										{subEvents.length > 0 && (
											subEvents.length > 0 &&
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[0].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FiClock className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{formatTime(subEvent.sub_eventsStartTime)}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[0].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FaLocationDot className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{subEvent.sub_eventsVenue}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[0].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index}>
														<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
															<div
																className="h-full bg-orange-300 rounded-full"
																style={{
																	width: `${(20 / 60) * 100}%`,
																}}
															></div>
														</div>
														<div className="text-xs text-gray-600 mt-2 flex justify-between">
															<span className="ml-[2px]">Current Attendees: </span>
															<span className="mr-[2px]">
																Max Attendees: {subEvent.sub_eventsMaxSeats}
															</span>
														</div>
													</div>
												))
										)}

										<div className="flex justify-between items-end mt-5">
											<div
												className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]"
												onClick={e => {
													e.stopPropagation(); // This line prevents the event from propagating
													openAttendanceModal(
														latestEvent[0].intFID,
													);
													fetchAttendanceList(latestEvent[0].intFID);
												}}>
												Attendance List
											</div>

											<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
												<span
													aria-hidden
													className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
												<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
												<span className="relative mt-[1px] leading-3 tracking-wider">
													Upcoming
												</span>
											</span>
										</div>
									</div>
								)}
							</div>
						)}

						{latestEvent[1] && (
							<div
								className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 h-[495px] w-full relative flex flex-col transition transform hover:scale-105"
								onClick={() => {
									const filteredSubEvent = subEvents.find(subEvent => subEvent.sub_eventsMainID === latestEvent[1].intFID);

									if (filteredSubEvent) {
										openModal(
											"https://source.unsplash.com/600x300?birthday",
											latestEvent[1]?.intFID,
											latestEvent[1]?.intFEventName,
											latestEvent[1]?.intFEventDescription,
											latestEvent[1]?.intFEventStartDate,
											latestEvent[1]?.intFEventEndDate,
											filteredSubEvent.sub_eventsID,
											filteredSubEvent.sub_eventsMainID,
											filteredSubEvent.sub_eventsName,
											filteredSubEvent.sub_eventsVenue,
											filteredSubEvent.sub_eventsStartDate,
											filteredSubEvent.sub_eventsEndDate,
											filteredSubEvent.sub_eventsStartTime,
											filteredSubEvent.sub_eventsEndTime,
											filteredSubEvent.sub_eventsMaxSeats,
											filteredSubEvent.sub_eventsOrganizer,
											filteredSubEvent.sub_eventsFaculty
										);
									}
								}}>
								<div className="w-full h-[300px] mb-4 relative">
									<div className="absolute -inset-6">
										<img
											src="https://source.unsplash.com/600x300?birthday"
											alt="Random"
											className="w-full h-full object-cover"
										/>
									</div>
								</div>
								{latestEvent[1] && (
									<div className="mt-6">
										{/* <h2 className="text-2xl font-semibold mb-2 text-slate-800">Event Title</h2> */}
										<h2 className="text-2xl font-semibold mb-2 text-slate-800">
											{latestEvent[1].intFEventName}
										</h2>
										<p className="text-gray-500 mb-4">
											{latestEvent[1].intFEventDescription}
										</p>
										<div className="flex items-center mt-4">
											<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">
												{formatDate(latestEvent[1].intFEventStartDate)}
											</p>
										</div>

										{subEvents.length > 0 && (
											subEvents.length > 0 &&
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[1].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FiClock className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{formatTime(subEvent.sub_eventsStartTime)}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[1].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FaLocationDot className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{subEvent.sub_eventsVenue}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[1].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index}>
														<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
															<div
																className="h-full bg-orange-300 rounded-full"
																style={{
																	width: `${(20 / 60) * 100}%`,
																}}
															></div>
														</div>
														<div className="text-xs text-gray-600 mt-2 flex justify-between">
															<span className="ml-[2px]">Current Attendees: </span>
															<span className="mr-[2px]">
																Max Attendees: {subEvent.sub_eventsMaxSeats}
															</span>
														</div>
													</div>
												))
										)}

										<div className="flex justify-between items-end mt-5">
											<div
												className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]"
												onClick={e => {
													e.stopPropagation(); // This line prevents the event from propagating
													openAttendanceModal(
														latestEvent[1].intFID,
													);
													fetchAttendanceList(latestEvent[1].intFID);
												}}>
												Attendance List
											</div>

											<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
												<span
													aria-hidden
													className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
												<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
												<span className="relative mt-[1px] leading-3 tracking-wider">
													Upcoming
												</span>
											</span>
										</div>
									</div>
								)}
							</div>
						)}

						{latestEvent[2] && (
							<div
								className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 h-[495px] w-full relative flex flex-col transition transform hover:scale-105"
								onClick={() => {
									const filteredSubEvent = subEvents.find(subEvent => subEvent.sub_eventsMainID === latestEvent[2].intFID);

									if (filteredSubEvent) {
										openModal(
											"https://source.unsplash.com/600x300?new+year",
											latestEvent[2]?.intFID,
											latestEvent[2]?.intFEventName,
											latestEvent[2]?.intFEventDescription,
											latestEvent[2]?.intFEventStartDate,
											latestEvent[2]?.intFEventEndDate,
											filteredSubEvent.sub_eventsID,
											filteredSubEvent.sub_eventsMainID,
											filteredSubEvent.sub_eventsName,
											filteredSubEvent.sub_eventsVenue,
											filteredSubEvent.sub_eventsStartDate,
											filteredSubEvent.sub_eventsEndDate,
											filteredSubEvent.sub_eventsStartTime,
											filteredSubEvent.sub_eventsEndTime,
											filteredSubEvent.sub_eventsMaxSeats,
											filteredSubEvent.sub_eventsOrganizer,
											filteredSubEvent.sub_eventsFaculty
										);
									}
								}}>
								<div className="w-full h-[300px] mb-4 relative">
									<div className="absolute -inset-6">
										<img
											src="https://source.unsplash.com/600x300?new+year"
											alt="Random"
											className="w-full h-full object-cover"
										/>
									</div>
								</div>
								{latestEvent[2] && (
									<div className="mt-6">
										{/* <h2 className="text-2xl font-semibold mb-2 text-slate-800">Event Title</h2> */}
										<h2 className="text-2xl font-semibold mb-2 text-slate-800">
											{latestEvent[2].intFEventName}
										</h2>
										<p className="text-gray-500 mb-4">
											{latestEvent[2].intFEventDescription}
										</p>
										<div className="flex items-center mt-4">
											<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">
												{formatDate(latestEvent[2].intFEventStartDate)}
											</p>
										</div>

										{subEvents.length > 0 && (
											subEvents.length > 0 &&
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[2].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FiClock className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{formatTime(subEvent.sub_eventsStartTime)}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[2].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FaLocationDot className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{subEvent.sub_eventsVenue}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[2].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index}>
														<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
															<div
																className="h-full bg-orange-300 rounded-full"
																style={{
																	width: `${(20 / 60) * 100}%`,
																}}
															></div>
														</div>
														<div className="text-xs text-gray-600 mt-2 flex justify-between">
															<span className="ml-[2px]">Current Attendees: </span>
															<span className="mr-[2px]">
																Max Attendees: {subEvent.sub_eventsMaxSeats}
															</span>
														</div>
													</div>
												))
										)}

										<div className="flex justify-between items-end mt-5">
											<div
												className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]"
												onClick={e => {
													e.stopPropagation(); // This line prevents the event from propagating
													openAttendanceModal(
														latestEvent[2].intFID,
													);
													fetchAttendanceList(latestEvent[2].intFID);
												}}>
												Attendance List
											</div>

											<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
												<span
													aria-hidden
													className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
												<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
												<span className="relative mt-[1px] leading-3 tracking-wider">
													Upcoming
												</span>
											</span>
										</div>
									</div>
								)}
							</div>
						)}

						{latestEvent[3] && (
							<div
								className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 h-[495px] w-full relative flex flex-col transition transform hover:scale-105"
								onClick={() => {
									const filteredSubEvent = subEvents.find(subEvent => subEvent.sub_eventsMainID === latestEvent[3].intFID);

									if (filteredSubEvent) {
										openModal(
											"https://source.unsplash.com/600x300?events",
											latestEvent[3]?.intFID,
											latestEvent[3]?.intFEventName,
											latestEvent[3]?.intFEventDescription,
											latestEvent[3]?.intFEventStartDate,
											latestEvent[3]?.intFEventEndDate,
											filteredSubEvent.sub_eventsID,
											filteredSubEvent.sub_eventsMainID,
											filteredSubEvent.sub_eventsName,
											filteredSubEvent.sub_eventsVenue,
											filteredSubEvent.sub_eventsStartDate,
											filteredSubEvent.sub_eventsEndDate,
											filteredSubEvent.sub_eventsStartTime,
											filteredSubEvent.sub_eventsEndTime,
											filteredSubEvent.sub_eventsMaxSeats,
											filteredSubEvent.sub_eventsOrganizer,
											filteredSubEvent.sub_eventsFaculty
										);
									}
								}}>
								<div className="w-full h-[300px] mb-4 relative">
									<div className="absolute -inset-6">
										<img
											src="https://source.unsplash.com/600x300?events"
											alt="Random"
											className="w-full h-full object-cover"
										/>
									</div>
								</div>
								{latestEvent[3] && (
									<div className="mt-6">
										{/* <h2 className="text-2xl font-semibold mb-2 text-slate-800">Event Title</h2> */}
										<h2 className="text-2xl font-semibold mb-2 text-slate-800">
											{latestEvent[3].intFEventName}
										</h2>
										<p className="text-gray-500 mb-4">
											{latestEvent[3].intFEventDescription}
										</p>
										<div className="flex items-center mt-4">
											<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">
												{formatDate(latestEvent[3].intFEventStartDate)}
											</p>
										</div>

										{subEvents.length > 0 && (
											subEvents.length > 0 &&
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[3].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FiClock className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{formatTime(subEvent.sub_eventsStartTime)}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[3].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FaLocationDot className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{subEvent.sub_eventsVenue}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[3].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index}>
														<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
															<div
																className="h-full bg-orange-300 rounded-full"
																style={{
																	width: `${(20 / 60) * 100}%`,
																}}
															></div>
														</div>
														<div className="text-xs text-gray-600 mt-2 flex justify-between">
															<span className="ml-[2px]">Current Attendees: </span>
															<span className="mr-[2px]">
																Max Attendees: {subEvent.sub_eventsMaxSeats}
															</span>
														</div>
													</div>
												))
										)}

										<div className="flex justify-between items-end mt-5">
											<div
												className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]"
												onClick={e => {
													e.stopPropagation(); // This line prevents the event from propagating
													openAttendanceModal(
														latestEvent[3].intFID,
													);
													fetchAttendanceList(latestEvent[3].intFID);
												}}>
												Attendance List
											</div>

											<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
												<span
													aria-hidden
													className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
												<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
												<span className="relative mt-[1px] leading-3 tracking-wider">
													Upcoming
												</span>
											</span>
										</div>
									</div>
								)}
							</div>
						)}

						{latestEvent[4] && (
							<div
								className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 h-[495px] w-full relative flex flex-col transition transform hover:scale-105"
								onClick={() => {
									const filteredSubEvent = subEvents.find(subEvent => subEvent.sub_eventsMainID === latestEvent[4].intFID);

									if (filteredSubEvent) {
										openModal(
											"https://source.unsplash.com/600x300?balloon",
											latestEvent[4]?.intFID,
											latestEvent[4]?.intFEventName,
											latestEvent[4]?.intFEventDescription,
											latestEvent[4]?.intFEventStartDate,
											latestEvent[4]?.intFEventEndDate,
											filteredSubEvent.sub_eventsID,
											filteredSubEvent.sub_eventsMainID,
											filteredSubEvent.sub_eventsName,
											filteredSubEvent.sub_eventsVenue,
											filteredSubEvent.sub_eventsStartDate,
											filteredSubEvent.sub_eventsEndDate,
											filteredSubEvent.sub_eventsStartTime,
											filteredSubEvent.sub_eventsEndTime,
											filteredSubEvent.sub_eventsMaxSeats,
											filteredSubEvent.sub_eventsOrganizer,
											filteredSubEvent.sub_eventsFaculty
										);
									}
								}}>
								<div className="w-full h-[300px] mb-4 relative">
									<div className="absolute -inset-6">
										<img
											src="https://source.unsplash.com/600x300?balloon"
											alt="Random"
											className="w-full h-full object-cover"
										/>
									</div>
								</div>
								{latestEvent[4] && (
									<div className="mt-6">
										{/* <h2 className="text-2xl font-semibold mb-2 text-slate-800">Event Title</h2> */}
										<h2 className="text-2xl font-semibold mb-2 text-slate-800">
											{latestEvent[4].intFEventName}
										</h2>
										<p className="text-gray-500 mb-4">
											{latestEvent[4].intFEventDescription}
										</p>
										<div className="flex items-center mt-4">
											<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">
												{formatDate(latestEvent[4].intFEventStartDate)}
											</p>
										</div>

										{subEvents.length > 0 && (
											subEvents.length > 0 &&
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[4].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FiClock className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{formatTime(subEvent.sub_eventsStartTime)}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[4].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FaLocationDot className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{subEvent.sub_eventsVenue}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[4].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index}>
														<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
															<div
																className="h-full bg-orange-300 rounded-full"
																style={{
																	width: `${(20 / 60) * 100}%`,
																}}
															></div>
														</div>
														<div className="text-xs text-gray-600 mt-2 flex justify-between">
															<span className="ml-[2px]">Current Attendees: </span>
															<span className="mr-[2px]">
																Max Attendees: {subEvent.sub_eventsMaxSeats}
															</span>
														</div>
													</div>
												))
										)}

										<div className="flex justify-between items-end mt-5">
											<div
												className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]"
												onClick={e => {
													e.stopPropagation(); // This line prevents the event from propagating
													openAttendanceModal(
														latestEvent[4].intFID,
													);
													fetchAttendanceList(latestEvent[4].intFID);
												}}>
												Attendance List
											</div>

											<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
												<span
													aria-hidden
													className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
												<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
												<span className="relative mt-[1px] leading-3 tracking-wider">
													Upcoming
												</span>
											</span>
										</div>
									</div>
								)}
							</div>
						)}

						{latestEvent[5] && (
							<div
								className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 h-[495px] w-full relative flex flex-col transition transform hover:scale-105"
								onClick={() => {
									const filteredSubEvent = subEvents.find(subEvent => subEvent.sub_eventsMainID === latestEvent[5].intFID);

									if (filteredSubEvent) {
										openModal(
											"https://source.unsplash.com/600x300?beers",
											latestEvent[5]?.intFID,
											latestEvent[5]?.intFEventName,
											latestEvent[5]?.intFEventDescription,
											latestEvent[5]?.intFEventStartDate,
											latestEvent[5]?.intFEventEndDate,
											filteredSubEvent.sub_eventsID,
											filteredSubEvent.sub_eventsMainID,
											filteredSubEvent.sub_eventsName,
											filteredSubEvent.sub_eventsVenue,
											filteredSubEvent.sub_eventsStartDate,
											filteredSubEvent.sub_eventsEndDate,
											filteredSubEvent.sub_eventsStartTime,
											filteredSubEvent.sub_eventsEndTime,
											filteredSubEvent.sub_eventsMaxSeats,
											filteredSubEvent.sub_eventsOrganizer,
											filteredSubEvent.sub_eventsFaculty
										);
									}
								}}>
								<div className="w-full h-[300px] mb-4 relative">
									<div className="absolute -inset-6">
										<img
											src="https://source.unsplash.com/600x300?beers"
											alt="Random"
											className="w-full h-full object-cover"
										/>
									</div>
								</div>
								{latestEvent[5] && (
									<div className="mt-6">
										{/* <h2 className="text-2xl font-semibold mb-2 text-slate-800">Event Title</h2> */}
										<h2 className="text-2xl font-semibold mb-2 text-slate-800">
											{latestEvent[5].intFEventName}
										</h2>
										<p className="text-gray-500 mb-4">
											{latestEvent[5].intFEventDescription}
										</p>
										<div className="flex items-center mt-4">
											<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">
												{formatDate(latestEvent[5].intFEventStartDate)}
											</p>
										</div>

										{subEvents.length > 0 && (
											subEvents.length > 0 &&
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[5].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FiClock className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{formatTime(subEvent.sub_eventsStartTime)}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[5].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index} className="flex items-center mt-3">
														<FaLocationDot className="text-2xl mr-2 text-slate-800" />
														<p className="text-slate-600 text-sm">
															{subEvent.sub_eventsVenue}
														</p>
													</div>
												))
										)}

										{subEvents.length > 0 && (
											subEvents
												.filter(subEvent => subEvent.sub_eventsMainID === latestEvent[5].intFID)
												.slice(0, 1) // Take only the first sub event
												.map((subEvent, index) => (
													<div key={index}>
														<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
															<div
																className="h-full bg-orange-300 rounded-full"
																style={{
																	width: `${(20 / 60) * 100}%`,
																}}
															></div>
														</div>
														<div className="text-xs text-gray-600 mt-2 flex justify-between">
															<span className="ml-[2px]">Current Attendees: </span>
															<span className="mr-[2px]">
																Max Attendees: {subEvent.sub_eventsMaxSeats}
															</span>
														</div>
													</div>
												))
										)}

										<div className="flex justify-between items-end mt-5">
											<div
												className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]"
												onClick={e => {
													e.stopPropagation(); // This line prevents the event from propagating
													openAttendanceModal(
														latestEvent[5].intFID,
													);
													fetchAttendanceList(latestEvent[5].intFID);
												}}>
												Attendance List
											</div>

											<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
												<span
													aria-hidden
													className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
												<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
												<span className="relative mt-[1px] leading-3 tracking-wider">
													Upcoming
												</span>
											</span>
										</div>
									</div>
								)}
							</div>
						)}
					</div>

					<div className="w-full bg-white border border-slate-200 rounded-lg p-6 h-[500px] transition transform hover:scale-105">
						<h2 className="text-2xl font-semibold mb-2">Calendar</h2>
						{/* <Calendar /> */}
					</div>
				</div>
			) : (
				<div className="w-full bg-slate-100 flex pb-28">
					<div className="w-full pr-6 bg-slate-100">
						<div className="w-full bg-slate-100">
							<div className="ml-6 font-bold text-lg">
								Today&aposs Event(s)
							</div>
							<div className="border-t border-gray-300 my-4 ml-6"></div>
							{latestEvent[0] && (
								<div
									className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 ml-5 w-full relative transition transform hover:scale-105 z-[50]"
									onClick={() =>
										openModal(
											"https://source.unsplash.com/600x300?party",
											latestEvent[0].intFID,
											latestEvent[0]?.intFEventName,
											latestEvent[0]?.intFDescription,
											latestEvent[0]?.intFStartDate,
											latestEvent[0]?.intFStartTime,
											latestEvent[0]?.intFEndTime,
											latestEvent[0]?.intFVenue,
											latestEvent[0]?.intFMaximumSeats,
											latestEvent[0].intFOrganizer,
											latestEvent[0].intFFaculty,
										)
									}>
									{latestEvent[0] && (
										<div className="ml-2 mr-2">
											{/* <h2 className="text-2xl font-semibold mb-2 text-slate-800">Event Title</h2> */}
											<h2 className="text-2xl font-semibold mb-2 text-slate-800">
												{latestEvent[0].intFEventName}
											</h2>
											<div className="border-t border-gray-300 my-4"></div>
											<p className="text-gray-500 mb-4">
												{latestEvent[0].intFDescription}
											</p>
											<div className="flex items-center mt-4">
												<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800" />
												<p className="text-slate-600 text-sm">
													{formatDate(latestEvent[0].intFStartDate)}
												</p>
											</div>
											<div className="flex items-center mt-3">
												<FiClock className="text-2xl mr-2 text-slate-800" />
												<p className="text-slate-600 text-sm">
													{formatTime(latestEvent[0].intFStartTime)}
												</p>
											</div>
											<div className="flex items-center mt-3">
												<FaLocationDot className="text-2xl mr-2 text-slate-800" />
												<p className="text-slate-600 text-sm">
													{latestEvent[0].intFVenue}
												</p>
											</div>
											<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
												<div
													className="h-full bg-orange-300 rounded-full"
													style={{
														width: `${(20 / 60) * 100}%`,
													}}></div>
											</div>
											<div className="text-xs text-gray-600 mt-2 flex justify-between">
												<span className="ml-[2px]">
													Current Attendees:{" "}
												</span>
												<span className="mr-[2px]">
													Max Attendees:{" "}
													{latestEvent[0].intFMaximumSeats}
												</span>
											</div>

											<div className="flex justify-between items-end mt-5">
												<div
													className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]"
													onClick={e => {
														e.stopPropagation(); // This line prevents the event from propagating
														openAttendanceModal(
															latestEvent[0].intFID,
														);
													}}>
													Attendance List
												</div>

												<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
													<span
														aria-hidden
														className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
													<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
													<span className="relative mt-[1px] leading-3 tracking-wider">
														Upcoming
													</span>
												</span>
											</div>
										</div>
									)}
								</div>
							)}

							<div className="ml-6 mt-5 font-bold text-lg">
								Tomorrow&aposs Event(s)
							</div>
							<div className="border-t border-gray-300 my-4 ml-6"></div>
							{latestEvent[1] && <div className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 ml-5 w-full relative transition transform hover:scale-105 z-[50]" onClick={() => openModal("https://source.unsplash.com/600x300?birthday", latestEvent[1].intFID, latestEvent[1].intFEventName, latestEvent[1]?.intFDescription, latestEvent[1]?.intFStartDate, latestEvent[1]?.intFStartTime, latestEvent[1]?.intFEndTime, latestEvent[1]?.intFVenue, latestEvent[1]?.intFMaximumSeats, latestEvent[1].intFOrganizer, latestEvent[1].intFFaculty)}>
								{latestEvent[1] && (
									<div className="ml-2 mr-2">
										<h2 className="text-2xl font-semibold mb-2 text-slate-800">{latestEvent[1].intFEventName}</h2>
										<div className="border-t border-gray-300 my-4"></div>
										<p className="text-gray-500">{latestEvent[1].intFDescription}</p>
										<div className="flex items-center mt-4">
											<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">{formatDate(latestEvent[1].intFStartDate)}</p>
										</div>
										<div className="flex items-center mt-3">
											<FiClock className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">{formatTime(latestEvent[1].intFStartTime)}</p>
										</div>
										<div className="flex items-center mt-3">
											<FaLocationDot className="text-2xl mr-2 text-slate-800" />
											<p className="text-slate-600 text-sm">{latestEvent[1].intFVenue}</p>
										</div>
										<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
											<div className="h-full bg-orange-300 rounded-full" style={{ width: `${(20 / 60) * 100}%` }}></div>
										</div>
										<div className="text-xs text-gray-600 mt-2 flex justify-between">
											<span className="ml-[2px]">Current Attendees: 23</span>
											<span className="mr-[2px]">Max Attendees: {latestEvent[1].intFMaximumSeats}</span>
										</div>
										<div className="flex justify-between items-end mt-5">
											<div className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]" onClick={e => { e.stopPropagation(); openAttendanceModal(latestEvent[1].intFID); }}>Attendance List</div>
											<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
												<span aria-hidden className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
												<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
												<span className="relative mt-[1px] leading-3 tracking-wider">Upcoming</span>
											</span>
										</div>
									</div>
								)}
							</div>}

							<div className="ml-6 mt-5 font-bold text-lg">
								Upcoming Event(s)
							</div>
							<div className="border-t border-gray-300 my-4 ml-6"></div>
							{latestEvent[2] && (
								<div
									className="bg-white border border-slate-200 rounded-lg overflow-hidden p-6 ml-5 w-full relative transition transform hover:scale-105 z-[50]"
									onClick={() =>
										openModal(
											"https://source.unsplash.com/600x300?new+year",
											latestEvent[2].intFID,
											latestEvent[2].intFEventName,
											latestEvent[2]?.intFDescription,
											latestEvent[2]?.intFStartDate,
											latestEvent[2]?.intFStartTime,
											latestEvent[2]?.intFEndTime,
											latestEvent[2]?.intFVenue,
											latestEvent[2]?.intFMaximumSeats,
											latestEvent[2].intFOrganizer,
											latestEvent[2].intFFaculty,
										)
									}>

									{latestEvent[2] && (
										<div className="ml-2 mr-2">
											<h2 className="text-2xl font-semibold mb-2 text-slate-800">
												{latestEvent[2].intFEventName}
											</h2>
											<div className="border-t border-gray-300 my-4"></div>
											<p className="text-gray-500">
												{latestEvent[2].intFDescription}
											</p>
											<div className="flex items-center mt-4">
												<HiMiniCalendarDays className="text-2xl mr-2 text-slate-800 -mt-[2px]" />
												<p className="text-slate-600 text-sm">
													{formatDate(latestEvent[2].intFStartDate)}
												</p>
											</div>
											<div className="flex items-center mt-3">
												<FiClock className="text-2xl mr-2 text-slate-800" />
												<p className="text-slate-600 text-sm">
													{formatTime(latestEvent[2].intFStartTime)}
												</p>
											</div>
											<div className="flex items-center mt-3">
												<FaLocationDot className="text-2xl mr-2 text-slate-800" />
												<p className="text-slate-600 text-sm">
													{latestEvent[2].intFVenue}
												</p>
											</div>
											<div className="mt-4 w-full h-[10px] bg-gray-200 rounded-full relative">
												<div
													className="h-full bg-orange-300 rounded-full"
													style={{
														width: `${(20 / 60) * 100}%`,
													}}></div>
											</div>
											<div className="text-xs text-gray-600 mt-2 flex justify-between">
												<span className="ml-[2px]">
													Current Attendees: 23
												</span>
												<span className="mr-[2px]">
													Max Attendees:{" "}
													{latestEvent[2].intFMaximumSeats}
												</span>
											</div>

											<div className="flex justify-between items-end mt-5">
												<div
													className="cursor-pointer text-slate-500 hover:font-medium text-[14.5px] ml-[1px]"
													onClick={e => {
														e.stopPropagation(); // This line prevents the event from propagating
														openAttendanceModal(
															latestEvent[2].intFID,
														);
													}}>
													Attendance List
												</div>
												<span className="relative px-3 py-[5px] font-semibold text-orange-900 text-xs flex items-center">
													<span
														aria-hidden
														className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
													<AiOutlineFieldTime className="mr-1 text-2xl font-bold relative" />
													<span className="relative mt-[1px] leading-3 tracking-wider">
														Upcoming
													</span>
												</span>
											</div>
										</div>
									)}
								</div>
							)}
						</div>
					</div>

					{/* <div className="w-1/4 pl-5">
					<div className="bg-white border border-slate-200 rounded-lg p-6 h-[470px] transition transform hover:scale-105">
						<h2 className="text-2xl font-semibold mb-2">Calendar</h2>
						{/* <Calendar /> 
					</div>
				</div> */}
				</div>
			)}
		</div>
	);
}
