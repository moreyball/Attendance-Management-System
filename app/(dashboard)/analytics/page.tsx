"use client";

import BarChart from "@/components/analytics/BarChart";
import Histogram from "@/components/analytics/Histogram";
import LineGraphExpenditure1 from "@/components/analytics/LineGraphExpenditure1";
import BarGraphAttendance from "@/components/analytics/BarGraphAttendance";
import PieChart from "@/components/analytics/PieChart";
import { useEffect, useState } from "react";

export default function Home() {
	const [startDate, setStartDate] = useState("");
	const [endDate, setEndDate] = useState("");

	const getStartAndEndOfMonth = () => {
		const today = new Date();
		const year = today.getFullYear();
		const month = today.getMonth() + 1;
		const lastDay = new Date(year, month, 0).getDate();
		const formattedMonth = month < 10 ? `0${month}` : `${month}`;
		const start = `${year}-${formattedMonth}-01`;
		const end = `${year}-${formattedMonth}-${lastDay}`;
		return {
			start,
			end,
		};
	};

	useEffect(() => {
		const { start, end } = getStartAndEndOfMonth();
		console.log("test1" + start);
		console.log("test2" + end);
		setStartDate(start);
		setEndDate(end);
	}, []);

	const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		if (name === "startDate") {
			// Check if the new start date is greater than the current end date
			if (new Date(value) > new Date(endDate)) {
				// If it is, set the end date to the new start date
				setEndDate(value);
			}
			setStartDate(value);
		} else if (name === "endDate") {
			// Check if the new end date is less than the current start date
			if (new Date(value) < new Date(startDate)) {
				// If it is, set the start date to the new end date
				setStartDate(value);
			}
			setEndDate(value);
		}
	};

	return (
		<div className="h-screen flex flex-row justify-start bg-slate-100">
			<div className="flex-1">
				<div className="flex-1 mx-auto px-5 py-5 bg-slate-100">
					<div className="p-4 mb-4 bg-white rounded-lg shadow-lg">
						<div className="text-center font-bold p-5">
							<h1>Budget Expediture/ Year</h1>
						</div>
						<LineGraphExpenditure1 />
					</div>
					<div className="p-4 mb-4 bg-white rounded-lg shadow-lg">
						<div className="text-center font-bold p-5">
							<h1>Number of Attendees each Faculty/ Unit by Date</h1>
						</div>
						<div className="justify-center items-center flex">
							<div className="">
								<label htmlFor="startDate" className="mr-2">
									Start Date:
								</label>
								<input
									type="date"
									id="startDate"
									name="startDate"
									value={startDate}
									onChange={handleDateChange}
									className="h-full rounded-md border bg-white border-gray-400 mb-5 text-gray-700 py-1 px-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm lg:text-base"
								/>
							</div>
							<div className="ml-4">
								<label htmlFor="endDate" className="mr-2">
									End Date:
								</label>
								<input
									type="date"
									id="endDate"
									name="endDate"
									value={endDate}
									onChange={handleDateChange}
									className="h-full rounded-md border bg-white border-gray-400 mb-5 text-gray-700 py-1 px-2 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm lg:text-base"
								/>
							</div>
						</div>
						<div className="">
							<BarGraphAttendance startDate={startDate} endDate={endDate} />
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
