"use client";

import Image from "next/image";

import EventModal from "@/components/Event_List_Modal";

import filterBar from "@/public/images/filter_bar_black.png";
import exportCSV from "@/public/images/export_csv.png";
import arrowLeft from "@/public/images/arrow_left.png";
import arrowRight from "@/public/images/arrow_right.png";
import skipLeft from "@/public/images/skip_left.png";
import skipRight from "@/public/images/skip_right.png";

import { FaSortAlphaDown, FaSortNumericDown, FaSortAmountUp } from "react-icons/fa";
import { IoMdRefresh, IoIosArrowBack } from "react-icons/io";
import { MdFilterListAlt } from "react-icons/md";

import { Fragment, useState, useEffect, SetStateAction } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import RightArrow from "@/components/icons/RightArrow";
import DoubleRightArrow from "@/components/icons/DoubleRightArrow";
import DoubleLeftArrow from "@/components/icons/DoubleLeftArrow";
import LeftArrow from "@/components/icons/LeftArrow";
import ExpenditureUser from "@/components/tables/expenditureUser";
import { Info } from "lucide-react";

type Info = {
	attFormsAttendanceID: string;
	attFormsStaffName: string;
	attFormsStaffID: string;
	attFormsStaffEmail: string;
	attFormsFacultyUnit: string;
};

type mainEvents = {
	intFID: string;
	intFEventName: string;
	intFEventDescription: string;
	intFEventStartDate: string;
	intFEventEndDate: string;
	intFDurationCourse: string;
	intFTrainerName: string;
	intFTrainingProvider: string;
};

type subEvents = {
	sub_eventsMainID: string;
	sub_eventsID: string;
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

export default function Home() {
	const supabase = createClientComponentClient();
	const [entriesToShow, setEntriesToShow] = useState(10); // Show the entries
	const [searchQuery, setSearchQuery] = useState(""); // Search queries for search bar
	const [currentPage, setCurrentPage] = useState(1); // Define state for current page
	const [activePage, setActivePage] = useState(1); // Define state for active page
	const [sortBy, setSortBy] = useState(""); // Initialize state for sorting
	const [sortOrder, setSortOrder] = useState("asc"); // Initialize sort order (asc or desc)
	const [showSortOptions, setShowSortOptions] = useState(false); // State to control dropdown visibility

	const [showModal, setShowModal] = useState(false);
	const [infos, setInfos] = useState<Info[]>([] as Info[]);
	const [subEventsAttended, setSubEventsAttended] = useState<subEvents[]>([]);
	const [mainEventAttended, setMainEventAttended] = useState<{ intFEventName: string[]; }[]>([]);
	const [allMainEvent, setAllMainEvent] = useState<mainEvents[]>([]);

	const [dataResults, setDataResults] = useState<{
		staffID: string;
		staffName: string;
		staffFaculty: string;
		totalSubEvents: number;
		subEventsAttended: string[];
		eventsAttended: string[];
		// eventsAttended: { mainEventID: string; subEventID: number }[];
	}[]>([]);

	const [aggregatedInfo, setAggregatedInfo] = useState<{
		staffID: string;
		staffName: string;
		staffFaculty: string;
		totalSubEvents: number;
		subEventsAttended: string[];
		eventsAttended: string[];
		// eventsAttended: { mainEventID: string; subEventID: number }[];
	}[]>([]);

	const fetchInfos = async () => {
		const { data: staffData, error: attendedEventError } = await supabase
			.from("attendance_forms")
			.select("*");

		if (attendedEventError) {
			console.error("Error fetching staff attendance data:", attendedEventError);
			return;
		}

		const { data: subEvents, error: subEventsError } = await supabase
			.from("sub_events")
			.select("*");

		if (subEventsError) {
			console.error("Error fetching sub_events:", subEventsError);
			return;
		}

		// Group the attendance forms by staff ID, store staff names, and calculate the total subevents attended
		const groupedData = staffData.reduce((result, form) => {
			// const uniqueStaffID = `${form.attFormsStaffID} - ${form.attFormsStaffName}`;
			const uniqueStaffID = form.attFormsStaffID;

			if (!result[uniqueStaffID]) {
				result[uniqueStaffID] = {
					staffID: form.attFormsStaffID,
					staffName: form.attFormsStaffName,
					staffFaculty: form.attFormsFacultyUnit,
					totalSubEvents: 0,
					subEventsAttended: [],
					eventsAttended: [],
				};
			}
			result[uniqueStaffID].totalSubEvents++;
			result[uniqueStaffID].subEventsAttended.push(form.attFSubEventID);
			result[uniqueStaffID].eventsAttended.push(subEvents
				.filter(event => event.sub_eventsID === form.attFSubEventID)
				.map(event => event.sub_eventsMainID));


			return result;

		}, {});

		// Set the aggregated data in the state
		setAggregatedInfo(Object.values(groupedData));
	};

	// Fetch data from database
	useEffect(() => {
		fetchInfos();
	}, [supabase]);

	//this is use to fetch sub event data of staff attended
	const fetchSubEventList = async (event_id: string[]) => {
		const { data: subEvents, error: subEventsError } = await supabase
			.from("sub_events")
			.select("*")
			.in("sub_eventsID", event_id)
			.order("sub_eventsStartDate");

		if (subEventsError) {
			console.error("Error fetching sub_events:", subEventsError);
			return;
		}

		setSubEventsAttended(subEvents || []);

		const mainEventIDs = subEvents.map((subEvent) => subEvent.sub_eventsMainID);

		//extract the main event title		
		const { data: mainEvent, error: mainEventError } = await supabase
			.from("internal_events")
			.select("intFEventName")
			.in("intFID", mainEventIDs)
			.order("intFEventStartDate");

		if (mainEventError) {
			console.error("Error fetching sub_events:", mainEventError);
			return;
		}
		setMainEventAttended((mainEvent || []));
	}

	useEffect(() => {
		const fetchMainEvent = async () => {
			const { data: mainEvent, error: mainEventError } = await supabase
				.from('internal_events')
				.select('*');

			if (mainEventError) {
				console.error("Error fetching main_events:", mainEventError);
				return;
			}
			setAllMainEvent(mainEvent || []);
		}

		fetchMainEvent();

	}, [supabase]);


	//display the sub event attended modal
	const openModal = async (staff_event_id: string[]) => {
		fetchSubEventList(staff_event_id);
		setShowModal(true);
	}

	// Refresh data from database
	const refreshData = async () => {
		fetchInfos();
	};

	const [activeTab, setActiveTab] = useState<'all' | 'staff' | 'student' | 'visitor'>('all');

	const handleSearch = (query: string) => {
		setSearchQuery(query);
		filterUserData(activeTab, query);
	};


	useEffect(() => {
		filterUserData(activeTab, searchQuery);
	}, [activeTab, searchQuery, aggregatedInfo]);


	type ColumnMapping = {
		[key: string]: string;
	};

	const columnMapping: ColumnMapping = {
		attFormsStaffID: 'Staff/ Student ID',
		attFormsStaffName: 'Staff Name',
		attFormsFacultyUnit: 'Faculty/Unit',
		totalSubEvents: 'Total Events Attended'
	};

	//export to CSV format
	const exportToCSV = () => {
		// Generate header row
		const header = Object.keys(columnMapping).map((key) => columnMapping[key]).join(',');
		// Combine header and data rows
		const csvContent = `${header}\n${aggregatedInfo.map(row => {
			// Exclude the eventsAttended field
			const { eventsAttended, ...rowWithoutEvents } = row;
			return Object.values(rowWithoutEvents).map(value => `"${value}"`).join(",");
		}).join("\n")}`;

		const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
		const link = document.createElement("a");

		link.href = URL.createObjectURL(blob);
		link.setAttribute("download", "staff_attendance_data.csv");
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	};


	// go to previous page
	const handleArrowLeftClick = () => {
		if (currentPage > 1) {
			setCurrentPage(currentPage - 1);
			setActivePage(currentPage - 1);
		}
	};

	// go to next page
	const handleArrowRightClick = () => {
		if (currentPage < Math.ceil(infos.length / entriesToShow)) {
			setCurrentPage(currentPage + 1);
			setActivePage(currentPage + 1);
		}
	};

	// skip to the first page
	const handleSkipToFirstPage = () => {
		setCurrentPage(1);
		setActivePage(1);
	};

	// skip to the last page
	const handleSkipToLastPage = () => {
		const lastPage = Math.ceil(infos.length / entriesToShow);
		setCurrentPage(lastPage);
		setActivePage(lastPage);
	};

	// Function to handle pagination button click
	const handlePageClick = (pageNumber: number) => {
		setCurrentPage(pageNumber);
		setActivePage(pageNumber);
	};

	// Handle page change
	const handlePageChange = (page: number) => {
		if (page >= 1 && page <= Math.ceil(aggregatedInfo.length / entriesToShow)) {
			setCurrentPage(page);
		}
	};

	useEffect(() => {
		setCurrentPage(1);
	}, [entriesToShow]);

	const pageCount = Math.ceil(aggregatedInfo.length / entriesToShow);

	const generatePageNumbers = (): number[] => {
		const displayedPages = 5;
		const halfDisplayed = Math.floor(displayedPages / 2);

		if (pageCount <= displayedPages) {
			return Array.from({ length: pageCount }, (_, index) => index + 1);
		}

		const start = Math.max(currentPage - halfDisplayed, 1);
		const end = Math.min(start + displayedPages - 1, pageCount);

		const pages: number[] = [];

		if (start > 1) {
			pages.push(1);
			if (start > 2) {
				pages.push(-1);
			}
		}

		for (let i = start; i <= end; i++) {
			pages.push(i);
		}

		if (end < pageCount) {
			if (end < pageCount - 1) {
				pages.push(-1);
			}
			pages.push(pageCount);
		}

		return pages.slice(0, displayedPages);
	};

	useEffect(() => {
		setCurrentPage(1);
	}, [aggregatedInfo])

	const getTotalHours = (subEventEndTime: string, subEventStartTime: string): number => {
		const endTime = new Date(subEventEndTime).getTime();
		const startTime = new Date(subEventStartTime).getTime();

		const differenceInMs = endTime - startTime;
		// Convert milliseconds to hours
		const totalHours = differenceInMs / (1000 * 60 * 60);
		return totalHours;
	}

	const [facultyOptions, setFacultyOptions] = useState<string[]>([]);
	const [facultyStudents, setFacultyStudents] = useState<string[]>([]);
	const [categories, setCategories] = useState<{ id: number; category: number; name: string; subcategories: { name: string; facultyUnit: number }[]; }[]>([]);
	const [selectedFacultyUnit, setSelectedFacultyUnit] = useState("");
	const [selectedCourse, setSelectedCourse] = useState("");

	useEffect(() => {
		// Function to fetch data from Supabase
		const fetchFacultyOptions = async () => {
			try {
				const { data, error } = await supabase
					.from('attendance_settings')
					.select('attsName')
					.eq('attsType', 1)
					.order('attsName', { ascending: true });

				if (error) {
					// console.error('Error fetching faculty options:', error.message);
					return;
				}

				// Extracting only the 'attsName' values from the data
				const facultyNames = data.map((item) => item.attsName);

				setFacultyOptions(facultyNames);
			} catch (error) {
				// console.error('Error:', error);
			}
		};

		// Fetch the faculty options when the component mounts
		fetchFacultyOptions();
	}, [])

	useEffect(() => {
		const fetchFacultyStudent = async () => {
			const { data, error } = await supabase
				.from('attendance_settings')
				.select('attsName')
				.eq('attsType', 0)
				.order('attsName', { ascending: true });

			if (error) {
				// console.error('Error fetching faculty units:', error);
				return;
			}

			const facultyStudents = data.map((item) => item.attsName);
			setFacultyStudents(facultyStudents);
		};

		fetchFacultyStudent();
	}, []);

	// retrieve units according categories
	useEffect(() => {
		const fetchFacultyUnits = async () => {
			const { data, error } = await supabase
				.from('attendance_settings')
				.select('attsID, attsName, attsCategory, attsSubcategory, attsType, attsPosition, attsFacultyUnit')
				.eq('attsType', 2)
				.order('attsCategory, attsName');
			// .order('attsCategory, attsPosition');

			if (error) {
				// console.error('Error fetching faculty units:', error);
				return;
			}

			if (data) {

				// Extract unique categories and subcategories
				const uniqueCategories = Array.from(new Set(data
					.filter(unit => unit.attsCategory > 0)));

				const uniqueSubcategories = Array.from(new Set(data
					.filter(unit => unit.attsSubcategory > 0)));

				// Create categories array with subcategories
				const categoriesArray = uniqueCategories.map((category) => ({
					id: category.attsCategory,
					category: category.attsPosition,
					name: category.attsName,
					subcategories: uniqueSubcategories
						.filter((subcategory) => category.attsCategory === subcategory.attsSubcategory)
						.map(subcategory => ({
							name: subcategory.attsName,
							facultyUnit: subcategory.attsFacultyUnit
						}))
				}));

				setCategories(categoriesArray);
			}
		};

		fetchFacultyUnits();
	}, []);

	const [selectedOption, setSelectedOption] = useState('');

	const handleSelectChange = (event: { target: { value: SetStateAction<string>; }; }) => {
		setSelectedOption(event.target.value);
	};

	const handleSelectFacultyUnitChange = (event: { target: { value: SetStateAction<string>; }; }) => {
		const value = event.target.value;
		setSelectedFacultyUnit(value);
		console.log(selectedFacultyUnit);
		filterUserData(activeTab, "");
	};

	const handleAnotherSelectChange = (event: { target: { value: any; }; }) => {
		const selectedCourse = event.target.value;
		// Concatenate the faculty/unit and the selected course
		const updatedSelectedOption = `${selectedOption} - ${selectedCourse}`;
	};

	const getSecondSelectOptions = () => {
		switch (selectedOption) {
			case 'Faculty of Business, Design and Arts':
				return (
					<>
						<option value="" disabled>Select Course</option>
						{categories
							.filter(category => category.category === 1 || category.category === 3)
							.map((category) => (
								<optgroup key={category.id} label={category.name}>
									{category.subcategories
										.filter(subcategory => subcategory.facultyUnit === 1 || subcategory.facultyUnit === 3)
										.map((subcategory, index) => (
											<option key={index} value={subcategory.name}>
												{subcategory.name}
											</option>
										))}
								</optgroup>
							))}

						<optgroup label="Not Mentioned Above">
							<option value="Other">Other</option>
						</optgroup>
					</>
				);
			case 'Faculty of Engineering, Computing and Science':
				return (
					<>
						<option value="" disabled>Select Option</option>
						{categories
							.filter(category => category.category === 2 || category.category === 3)
							.map((category) => (
								<optgroup key={category.id} label={category.name}>
									{category.subcategories
										.filter(subcategory => subcategory.facultyUnit === 2 || subcategory.facultyUnit === 3)
										.map((subcategory, index) => (
											<option key={index} value={subcategory.name}>
												{subcategory.name}
											</option>
										))}
								</optgroup>
							))}

						<optgroup label="Not Mentioned Above">
							<option value="Other">Other</option>
						</optgroup>
					</>
				);
			default:
				return (
					<option value="" disabled>
						Select Option
					</option>
				);
		}
	};

	const filterUserData = (tab: 'all' | 'staff' | 'student' | 'visitor', query: string) => {
		setSearchQuery(query);

		// Clear the data results
		setDataResults([]);

		let filteredUserData = [...aggregatedInfo];

		if (tab === 'staff') {
			filteredUserData = aggregatedInfo.filter((item) => item.staffID.startsWith('SS'));
		} else if (tab === 'student') {
			filteredUserData = aggregatedInfo.filter((item) => item.staffID !== '0' && !item.staffID.startsWith('SS'));
		} else if (tab === 'visitor') {
			filteredUserData = aggregatedInfo.filter((item) => item.staffID === '0');
		}

		if (selectedFacultyUnit.length > 0 && selectedFacultyUnit !== 'all') {
			filteredUserData = aggregatedInfo.filter((item) => selectedFacultyUnit === item.staffFaculty);
		}

		if (query) {
			filteredUserData = filteredUserData.filter(
				info => {
					return (
						info.staffName.toLowerCase().includes(query.toLowerCase()) ||
						info.staffID.toString().includes(query) ||
						info.staffFaculty.toLowerCase().includes(query.toLowerCase())
					);
				}
			);
		}

		setDataResults(filteredUserData);
	};

	// Show Sort Options
	const handleSortButtonClick = () => {
		setShowSortOptions(!showSortOptions); // Toggle dropdown visibility
	};

	// Toggle sort order between 'asc' and 'desc' when ID is selected
	const handleSortButtonMenuClick = () => {
		if (sortBy === "staffid" || sortBy == "name" || sortBy == "eventattended") {
			// If it's already sorted by name, toggle between 'asc' and 'desc'
			setSortOrder(sortOrder === "asc" ? "desc" : "asc");
		} else {
			// Set the sorting option to name and default to 'asc'
			setSortBy("staffid");
			setSortOrder("asc");
		}
		setShowSortOptions(false);
	};

	// An array of sorting options
	const sortOptions = [
		{ label: "Staff Name", value: "name" },
		{ label: "Staff ID", value: "staffid" },
		{ label: "Number of Event Attended", value: "eventattended" },

	];

	// Modify the sorting logic based on the selected option and sort order
	const sortedData = (dataResults.length > 0 ? dataResults : aggregatedInfo)
		.slice()
		.sort((a, b) => {
			if (sortBy === "staffid") {
				// Sort by ID
				if (sortOrder === "asc") {
					return a.staffID.localeCompare(b.staffID, undefined, { sensitivity: 'base' });
				} else {
					return b.staffID.localeCompare(a.staffID, undefined, { sensitivity: 'base' });
				}
			} else if (sortBy === "name") {
				if (sortOrder === "asc") {
					return b.staffName.localeCompare(a.staffName, undefined, { sensitivity: 'base' });
				} else {
					return a.staffName.localeCompare(b.staffName, undefined, { sensitivity: 'base' });
				}
			}
			else if (sortBy === "eventattended") {
				if (sortOrder === "asc") {
					return b.totalSubEvents - a.totalSubEvents;
				} else {
					return a.totalSubEvents - b.totalSubEvents;
				}
			}
			return 0;
		});

	const [showFilterOptions, setShowFilterOptions] = useState(false);

	// Show Filter Options
	const handleFilterButtonClick = () => {
		setShowFilterOptions(!showFilterOptions); // Toggle dropdown visibility
	};

	return (
		<div>
			<div className="">
				<div className="flex-1">
					<div className="flex-1 mx-auto px-4 sm:px-[26px] py-[26px] bg-slate-100 dark:bg-dark_mode_bg">
						<div className="bg-white rounded p-8 dark:bg-dark_mode_card">
							<div className="inline-flex">
								<span className="mt-[7px]"><a href="/homepage"><IoIosArrowBack className="text-2xl -mt-[1.5px] mr-[6px] text-slate-800 -ml-1 dark:text-dark_text" /></a></span>
								<h1 className="text-xl font-bold lg:text-2xl"><span className="ml-[5px] text-slate-800 dark:text-dark_text">Reports</span></h1>
							</div>
							<Fragment>
								<div className="flex-1 items-center justify-left mb-8">

								</div>
							</Fragment>

							<div className="flex items-center justify-between mb-8">
								{/* Refresh Button */}
								<button
									type="button"
									className="items-center bg-slate-200 rounded-lg py-2 px-4 font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-sm md:inline-flex hidden dark:bg-[#242729]"
									onClick={refreshData}>
									<IoMdRefresh className="text-xl text-slate-800 dark:text-dark_text" />
									<span className="ml-2 -mt-[1.25px] text-slate-800 dark:text-dark_text">
										Refresh
									</span>
								</button>

								<div className="flex items-center">
									{/* Search Input */}
									<div className="max-w-full relative shadow hover:shadow-sm border border-slate-300 rounded mr-3 hover:transition duration-300 transform hover:scale-105">
										<span className="h-full absolute inset-y-0 left-0 flex items-center pl-2">
											<svg
												viewBox="0 0 24 24"
												className="h-4 w-4 fill-current text-gray-500">
												<path d="M10 4a6 6 0 100 12 6 6 0 000-12zm-8 6a8 8 0 1114.32 4.906l5.387 5.387a1 1 0 01-1.414 1.414l-5.387-5.387A8 8 0 012 10z"></path>
											</svg>
										</span>
										<input
											placeholder="Search here..."
											className="appearance-none rounded-md block pl-8 pr-6 py-2 bg-white text-sm placeholder-gray-400 text-gray-700 focus:bg-white focus:placeholder-gray-600 focus:text-gray-700 focus:outline-none dark:bg-dark_mode_card dark:border-[#2E3E50] dark:placeholder:text-[#484945]"
											value={searchQuery}
											onChange={e => handleSearch(e.target.value)}
										/>
									</div>

									{/* mobile view */}
									<button
										type="button"
										className="items-center bg-slate-200 rounded-lg py-2 px-4 font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-sm md:hidden lg:hidden hover:transition duration-300 transform hover:scale-105"
										onClick={refreshData}>
										<IoMdRefresh className="text-xl text-slate-800" />
									</button>

									{/* Filter */}
									{/* <div className="relative">
										<button
											type="button"
											className="items-center justify-center bg-slate-200 rounded-lg py-2 px-4 font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 mr-3 shadow-sm md:inline-flex hidden hover:transition duration-300 transform hover:scale-105 dark:bg-[#242729]"
											onClick={handleFilterButtonClick}>
											<MdFilterListAlt className="text-xl"/>
											<span className="ml-2 text-slate-800 dark:text-dark_text">Filters</span>
										</button>
									</div>								 */}


									{/* Sort By Button */}
									<div className="relative">
										<button
											type="button"
											className="items-center justify-center bg-slate-200 rounded-lg py-2 px-4 font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 mr-3 shadow-sm md:inline-flex hidden hover:transition duration-300 transform hover:scale-105 dark:bg-[#242729]"
											onClick={handleSortButtonClick}>
											<Image
												src={filterBar.src}
												alt=""
												width={20}
												height={20}
												className="text-slate-800"
											/>
											<span className="ml-2 text-slate-800 dark:text-dark_text">Sort By</span>
										</button>

										{/* Dropdown Menu */}
										<div
											className={`absolute top-[45px] transform translate-x-0 translate-y-0 transition-transform duration-300 ease-in-out ${showSortOptions ? "translate-x-0" : ""
												}`}
											style={{ zIndex: 999 }}>
											{showSortOptions && (
												<div className="bg-white border-l border-t border-r border-gray-200 shadow-md w-72 rounded-lg">
													<ul>
														<li className="px-4 py-2 cursor-pointer flex items-center text-gray-600">
															<span className="font-bold text-slate-800">
																Sort By:
															</span>
														</li>
														{sortOptions.map(option => (
															<li
																key={option.value}
																className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center transition-all duration-200 ease-in-out font-medium"
																onClick={() => {
																	handleSortButtonMenuClick(); // Hide the dropdown when an option is selected
																	setSortBy(option.value); // Set the sorting option
																}}>
																{option.value === "name" && (
																	<FaSortAlphaDown className="mr-3 ml-2 text-slate-800" />
																)}
																{option.value === "staffid" && (
																	<FaSortNumericDown className="mr-3 ml-2 text-slate-800" />
																)}
																{option.value === "eventattended" && (
																	<FaSortAmountUp className="mr-3 ml-2 text-slate-800 whitespace-nowrap" />
																)}
																<span className="text-slate-500 ">
																	{option.label}
																</span>
															</li>
														))}
													</ul>
												</div>
											)}
										</div>
									</div>

									{/* Export Button */}
									<button
										type="button"
										className="items-center justify-center bg-slate-200 rounded-lg py-2 px-4 font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-sm md:inline-flex hidden dark:bg-[#242729]"
										onClick={exportToCSV}>
										<img
											src={exportCSV.src}
											alt=""
											width={20}
											className="text-slate-800"
										/>
										<span className="ml-2 text-slate-800 dark:text-dark_text">Export to CSV</span>
									</button>
								</div>
							</div>

							<div className="flex flex-row">
								<button
									className={`flex rounded-md items-center pt-2 pb-2 pl-3 pr-3 mr-3 font-bold hover:bg-slate-300 dark:hover:bg-[#2F3335] mb-3.5 shadow-sm md:inline-flex ${activeTab === 'all' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-[#242729] dark:text-[#CCC7C1]'
										}`}
									onClick={() => setActiveTab('all')}
								>
									All
								</button>
								<button
									className={`flex rounded-md items-center pt-2 pb-2 pl-3 pr-3 mr-3 font-bold hover:bg-slate-300 dark:hover:bg-[#2F3335] mb-3.5 shadow-sm md:inline-flex ${activeTab === 'staff' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-[#242729] dark:text-[#CCC7C1]'
										}`}
									onClick={() => { setActiveTab('staff') }}
								>
									Staff
								</button>
								<button
									className={`flex rounded-md items-center pt-2 pb-2 pl-3 pr-3 mr-3 font-bold hover:bg-red-200 dark:hover:bg-[#2F3335] mb-3.5 shadow-sm md:inline-flex ${activeTab === 'student' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-[#242729] dark:text-[#CCC7C1]'
										}`}
									onClick={() => { setActiveTab('student') }}
								>
									Student
								</button>
								<button
									className={`flex rounded-md items-center pt-2 pb-2 pl-3 pr-3 mr-3 font-bold hover:bg-red-200 dark:hover:bg-[#2F3335] mb-3.5 shadow-sm md:inline-flex ${activeTab === 'visitor' ? 'bg-red-600 text-white' : 'bg-slate-200 text-slate-800 dark:bg-[#242729] dark:text-[#CCC7C1]'
										}`}
									onClick={() => { setActiveTab('visitor') }}
								>
									Visitor
								</button>
							</div>

							{/* {showFilterOptions && (
								<div className="border-[1px] p-4 w-full">									
								
									<div className="flex flex-row">			
									{(activeTab === "staff" || activeTab === "all") && (
										<div>
											<label>Faculty / Unit (Staff)</label>
											<select
											name="facultyUnit"
											id="facultyUnit"
											defaultValue=""
											className="px-4 py-2 border border-gray-300 focus:outline-none mt-3 text-xs lg:text-base"
											required
											onChange={event => {handleSelectFacultyUnitChange(event);}}
											>
												<option value="" disabled>
													Select Faculty/ Unit
												</option>
												<option value="all">
													All
												</option>
												{facultyOptions.map((faculty, index) => (
													<option key={index} value={faculty}>
														{faculty}
													</option>
												))}
											</select>
										</div>
									)} 
									
									{(activeTab === "student" || activeTab === "all") && (
										<div>
											<label>Course</label>
											<select
												name="studentFacultyUnit"
												id="studentFacultyUnit"
												defaultValue=""
												className="px-4 py-2 border-[1px] rounded-md border-gray-300 focus:outline-none mt-3 text-xs lg:text-base"
												required
												onChange={event => handleSelectChange(event)}
											>												
												<option value="" disabled>Select Faculty/ Unit</option>
												{facultyStudents.map((faculty, index) => (
													<option key={index} value={faculty}>
														{faculty}
													</option>
												))}
												<option value="Both">Both</option>
											</select>

											{selectedOption &&
												<div className="mb-3 lg:mb-4 p-2 pr-[100px] py-8 pl-5 bg-white rounded-lg">
													<div className="ml-1">														
														<select
															name="anotherSelect"
															id="anotherSelect"
															defaultValue=""
															className="border-[1px] px-4 py-2 border-gray-300 focus:outline-none mt-3 text-xs lg:text-base"
															required
															onChange={handleAnotherSelectChange}
														>
															{getSecondSelectOptions()}
														</select>
													</div>
												</div>
											}
										</div>
									)}
									</div>
								</div>
							)} */}

							<div className="-mx-4 hidden sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto lg:block">
								<div className="inline-block min-w-full shadow rounded-sm overflow-hidden">
									<table className="min-w-full leading-normal min-h-[70vh]">
										{/* Table Header */}
										<thead>
											<tr className="flex">
												<th className="flex-1 px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-[#363B3D] text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap dark:bg-[#1D2021] dark:text-[#B0AA9F]">
													NO.
												</th>
												<th className="flex-1 px-[21px] py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-[#363B3D] text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap dark:bg-[#1D2021] dark:text-[#B0AA9F]">
													<span className="ml-1">Name</span>
												</th>
												<th className="flex-1 px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-[#363B3D] text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap dark:bg-[#1D2021] dark:text-[#B0AA9F]">
													<span className="-ml-[1px]">Staff / Student ID</span>
												</th>
												<th className="flex-1 px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-[#363B3D] text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap dark:bg-[#1D2021] dark:text-[#B0AA9F]">
													<span className="-ml-[1px]">Faculty / Unit</span>
												</th>
												<th className="flex-1 px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 dark:border-[#363B3D] text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap dark:bg-[#1D2021] dark:text-[#B0AA9F]">
													<span className="-ml-[3px]">Event Attended</span>
												</th>
											</tr>
										</thead>

										{/* Table Body */}
										<tbody>
											{sortedData
												.slice(
													(currentPage - 1) * entriesToShow,
													currentPage * entriesToShow,
												)
												.map((info, index) => (
													<tr className="flex" key={info.staffID}
														onClick={() => {
															openModal(info.subEventsAttended);
														}}
													>
														<td className="flex-1 px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm dark:bg-dark_mode_card dark:border-[#363B3D]">
															<div className="flex items-center">
																<div className="ml-[14px]">
																	<p className="text-gray-900 whitespace-no-wrap dark:text-dark_text">
																		{(currentPage - 1) * entriesToShow + index + 1}
																	</p>
																</div>
															</div>
														</td>
														<td className="flex-1 -ml-16 lg:ml-0 lg:px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm dark:bg-dark_mode_card dark:border-[#363B3D]">
															<p className="text-gray-900 whitespace-no-wrap lg:ml-3 dark:text-dark_text">
																{info.staffName}
															</p>
														</td>
														<td className="flex-1 -ml-2 lg:ml-0 lg:px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm dark:bg-dark_mode_card dark:border-[#363B3D]">
															<p className="text-gray-900 whitespace-no-wrap dark:text-dark_text">
																{info.staffID}
															</p>
														</td>
														<td className="flex-1 lg:px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm dark:bg-dark_mode_card dark:border-[#363B3D]">
															<p className="text-gray-900 whitespace-no-wrap -ml-6 lg:ml-1 dark:text-dark_text">
																{info.staffFaculty}
															</p>
														</td>

														<td className="flex-1 lg:px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm dark:bg-dark_mode_card dark:border-[#363B3D]">
															<p className="text-gray-900 whitespace-no-wrap -ml-6 lg:ml-1 dark:text-dark_text">
																{info.totalSubEvents}
																{allMainEvent
																	.filter(event => info.eventsAttended.includes(event.intFID))
																	.map((e, index) => (<p key={index}>{e.intFEventName}</p>))}
															</p>
														</td>
													</tr>
												))}

											{/* pagination */}
											{Array.from({
												length: entriesToShow - aggregatedInfo.length,
											}).map((_, index) => (
												<tr className="flex invisible" key={index}>
													<td className="flex-1 px-5 py-5 border-b border-gray-200 bg-white text-sm">
														<div className="flex items-center">
															<div className="ml-[14px]">
																<p className="text-gray-900 whitespace-no-wrap"></p>
															</div>
														</div>											</td>
													<td className="flex-1 px-5 py-5 border-b border-gray-200 bg-white text-sm">
														<p className="text-gray-900 whitespace-no-wrap ml-3"></p>
													</td>
													<td className="flex-1 px-5 py-5 border-b border-gray-200 bg-white text-sm">
														<p className="text-gray-900 whitespace-no-wrap"></p>
													</td>
													<td className="flex-1 px-5 py-5 border-b border-gray-200 bg-white text-sm">
														<p className="text-gray-900 whitespace-no-wrap ml-1"></p>
													</td>
													<td
														className={`flex-1 px-5 py-5 border-b border-gray-200 bg-white text-sm`}>
														<span
															className={`relative inline-block px-3 py-2 font-semibold text-gray-900 leading-tight`}>
															<span
																aria-hidden
																className={`absolute inset-0 opacity-0 rounded-full`}></span>
															<span className="relative"></span>
														</span>
													</td>
												</tr>
											))}
										</tbody>
									</table>

									<div className="px-5 py-5 bg-white border-t flex items-center justify-between dark:bg-dark_mode_card dark:border-[#363B3D]">
										<div className=" items-center text-[14px] text-base hidden lg:flex">
											<div className="mr-2 ml-3">
												<span className="text-sm lg:text-base text-slate-800 dark:text-dark_text">Show</span>
											</div>

											{/* Filter By How Many Entries */}
											<div className="relative mr-2">
												<select
													value={entriesToShow}
													onChange={e =>
														setEntriesToShow(parseInt(e.target.value))
													}
													className="appearance-none h-full rounded-l border block bg-white border-gray-400 text-gray-700 py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm lg:text-base dark:bg-dark_mode_card dark:border-[#484E51] dark:text-dark_text">
													<option
														value={5}
														className="text-sm lg:text-base dark:text-dark_text">
														5
													</option>
													<option
														value={10}
														className="text-sm lg:text-base dark:text-dark_text">
														10
													</option>
													<option
														value={20}
														className="text-sm lg:text-base dark:text-dark_text">
														20
													</option>
												</select>
												<div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700 dark:text-dark_text">
													<svg
														className="fill-current h-4 w-4"
														xmlns="http://www.w3.org/2000/svg"
														viewBox="0 0 20 20">
														<path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
													</svg>
												</div>
											</div>

											<div>
												<span className="text-sm lg:text-base dark:text-dark_text">
													entries
												</span>
											</div>
										</div>
										<div className="ems-center hidden lg:flex">
											<span className="text-sm mt-6 lg:text-base lg:text-[14px] lg:text-gray-900 lg:mr-2 hidden md:inline">
												1-{entriesToShow} of {aggregatedInfo?.length} entries
											</span>

											<div className="pagination justify-end mt-5 pb-5 ems-center hidden lg:flex">
												<button
													className={`py-2 px-1 ml-5 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
													onClick={() => handlePageChange(1)}
													disabled={currentPage === 1}
												>
													<img
														src={skipLeft.src}
														alt=""
														width={20}
														className="lg:w-[22px]"
													/>
												</button>
												<button
													onClick={() => handlePageChange(currentPage - 1)}
													disabled={currentPage === 1}
													className={`py-2 px-1 ml-5 ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
												>
													<img
														src={arrowLeft.src}
														alt=""
														width={12}
														className="lg:w-[13px]"
													/>
												</button>

												{/* Pagination Buttons */}
												{generatePageNumbers().map((pageNumber, index) => (
													<button
														key={index}
														className={`py-1 px-3 ml-5 rounded font-medium text-sm lg:text-[15px] ${currentPage === pageNumber ? "text-slate-100 bg-slate-900" : "text-slate-800 bg-slate-200"
															}`}
														onClick={() => handlePageChange(pageNumber)}
													>
														{pageNumber === -1 ? '...' : pageNumber}
													</button>
												))}

												<button
													onClick={() => handlePageChange(currentPage + 1)}
													disabled={currentPage === pageCount}
													className={`py-2 px-1 ml-5 ${currentPage === pageCount ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
												>
													<img
														src={arrowRight.src}
														alt=""
														width={12}
														className="lg:w-[13px]"
													/>
												</button>
												<button
													className={`py-2 px-1 ml-5 ${currentPage === pageCount ? 'opacity-50 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
													onClick={() => handlePageChange(pageCount)}
													disabled={currentPage === pageCount}
												>
													<img
														src={skipRight.src}
														alt=""
														width={17}
														className="lg:w-[18px]"
													/>
												</button>
											</div>
										</div>
									</div>
								</div>
							</div>

							{/* mobile view table*/}
							<div className="grid grid-cols-1 gap-4 mb-12 lg:hidden">
								{sortedData
									.map((info, index) => (
										<div key={info.staffID} className="bg-slate-100 p-4 rounded-lg shadow">
											<table className="w-full">
												<tr className="border-b-2 border-gray-200 bg-gray-100">
													<th className="py-3 float-left text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
														No.
													</th>
													<td className="float-right flex text-xs mt-3 px-4">
														{(currentPage - 1) * 3 + index + 1}
													</td>
												</tr>
												<tr className="border-b-2 border-gray-200 bg-gray-100">
													<th className="py-3 float-left text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
														Name
													</th>
													<td className="float-right text-xs mt-3 px-4">
														{info.staffName}
													</td>
												</tr>
												<tr className="border-b-2 border-gray-200 bg-gray-100">
													<th className="py-3 float-left text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
														Staff / Student ID
													</th>
													<td className="float-right text-xs mt-3 px-4">
														{info.staffID}
													</td>
												</tr>
												<tr className="border-b-2 border-gray-200 bg-gray-100">
													<th className="py-3 float-left text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
														Faculty / Unit
													</th>
													<td className="float-right text-xs mt-3 px-4">
														{info.staffFaculty}
													</td>
												</tr>
												<tr className="border-b-2 border-gray-200 bg-gray-100">
													<th className="py-3 float-left text-left text-xs font-semibold text-gray-600 uppercase tracking-wider whitespace-nowrap">
														Event Attended
													</th>
													<td className="float-right text-xs py-1 mr-4">
														{info.totalSubEvents}
													</td>
												</tr>

												<tr className="bg-gray-100">
													<span className="text-sky-800 float-right border bg-slate-200 rounded-full p-2 mt-2">
														<p
															onClick={() => { openModal(info.subEventsAttended); }}
														>View</p>
													</span>
												</tr>
											</table>
										</div>
									))}
							</div>

							{/*mobile view pagination */}
							<div className="pagination flex justify-center items-center mt-5 pb-24 lg:hidden">
								<button
									className="opacity-70"
									onClick={() => handleSkipToFirstPage}
									disabled={currentPage === 1}
								>
									<DoubleLeftArrow />
								</button>
								<button
									onClick={() => handleArrowLeftClick}
									disabled={currentPage === 1}
									className="opacity-70"
								>
									<LeftArrow />
								</button>

								{/* Pagination Buttons */}
								<div className="flex">
									{[1, 2, 3].map(pageNumber => (
										<button
											type="button"
											className={`py-1 px-3 ml-5 rounded font-medium text-sm lg:text-[15px] ${pageNumber === activePage
												? "text-slate-100 bg-slate-900"
												: "text-slate-800 bg-slate-200"
												}`}
											key={pageNumber}
											onClick={() => {
												if (
													pageNumber <=
													Math.ceil(
														aggregatedInfo.length /
														entriesToShow,
													)
												) {
													handlePageClick(pageNumber);
												}
											}}>
											{pageNumber}
										</button>
									))}
								</div>

								<button
									onClick={handleArrowRightClick}
									disabled={
										currentPage ===
										Math.ceil(aggregatedInfo?.length / entriesToShow)
									}
									className="opacity-70"
								>
									<RightArrow />
								</button>
								<button
									className="opacity-70"
									onClick={handleSkipToLastPage}
								>
									<DoubleRightArrow />
								</button>
							</div>
						</div>
					</div>

					<EventModal isVisible={showModal} onClose={() => setShowModal(false)}>
						<p className='font-semibold text-md text-gray-600 p-2 ml-2'>Sub-Events Attended</p>
						<div className="p-5 bg-slate-100 h-[520px] lg:w-[1160px] lg:h-[420px] ml-1 overflow-auto">
							<table className="leading-normal w-[1090px] ml-4 hidden lg:table">
								<thead>
									<tr className="flex">
										<th className="flex-1 pl-[33px] px-[10px] py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
											NO.
										</th>
										<th className="flex-1 pr-[120px] py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
											Main Event
										</th>
										<th className="flex-1 pr-[120px] py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
											Sub-Event Session
										</th>
										<th className="flex-1 pr-[120px] py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
											Start Date
										</th>
									</tr>
								</thead>
								<tbody>
									{subEventsAttended
										.map((subEvent, index) => (
											<tr className="flex"
												key={index}
												onClick={() => setShowModal(true)}>

												<td className="flex-1 py-5 text-xs mt-1 lg:text-xs ml-8">
													<div>
														<div className="ml-[2px]">
															<p className="text-gray-900">
																{index + 1}
															</p>
														</div>
													</div>
												</td>
												<td className="flex-1 py-5 text-xs lg:text-md -ml-24">
													<p className="text-gray-900">
														{mainEventAttended[index]?.intFEventName || "N/A"}
													</p>
												</td>

												<td className="flex-1 px-3 py-5 text-xs lg:text-md ">
													<p className="text-gray-900 ml-1">
														{subEvent.sub_eventsName}
													</p>
												</td>

												<td className="flex-1 px-3 py-5 text-xs lg:text-md">
													<p className="text-gray-900 -ml-2">
														{subEvent.sub_eventsStartDate} {subEvent.sub_eventsStartTime}
													</p>
												</td>
											</tr>
										))}
								</tbody>
							</table>

							{/* mobile view */}
							<div className="grid grid-cols-1 gap-4 lg:hidden">
								{subEventsAttended
									.map((subEvent, index) => (
										<div key={index} className="bg-slate-100 p-4 rounded-lg overflow-auto shadow">
											<table className="overflow-auto min-w-full leading-normal">
												<tr className="border-b-2 border-gray-200 bg-gray-100">
													<th className="py-3 float-left text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
														No.
													</th>
													<td className="float-right flex text-xs mt-3 px-4">
														{index + 1}
													</td>
												</tr>
												<tr className="border-b-2 border-gray-200 bg-gray-100">
													<th className="py-3 float-left text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
														Main Event
													</th>
													<td className="float-right flex text-xs mt-3 px-4">
														{mainEventAttended[index]?.intFEventName || "N/A"}
													</td>
												</tr>
												<tr className="border-b-2 border-gray-200 bg-gray-100">
													<th className="py-3 float-left text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
														Sub-Event Session
													</th>
													<td className="float-right flex text-xs mt-3 px-4">
														{subEvent.sub_eventsName}
													</td>
												</tr>
												<tr className="bg-gray-100">
													<th className="py-3 float-left text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
														Start Date
													</th>
													<td className="float-right flex text-xs mt-3 px-4">
														{subEvent.sub_eventsStartDate} {subEvent.sub_eventsStartTime}
													</td>
												</tr>
											</table>
										</div>
									))}
							</div>
						</div>
					</EventModal>
				</div>
			</div>

			<div className="flex flex-row">
				<div className="flex-1 mx-auto px-4 sm:px-[26px] py-[26px] bg-slate-100 dark:bg-dark_mode_bg">
					<div className="bg-white rounded p-8 dark:bg-dark_mode_card">
						<div className="inline-flex mb-5">
							<h1 className="text-xl font-bold lg:text-2xl"><span className="ml-[5px] text-slate-800 dark:text-dark_text">Staff Expenditure</span></h1>
						</div>
						<ExpenditureUser />
					</div>
				</div>
			</div>
		</div>
	);
}
