import * as z from "zod";

const today = new Date();
today.setHours(0, 0, 0, 0);

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB in bytes

const adminExternalFormSchema = z
	.object({
		// Additional Fields,
		revertComment: z.string().optional(),
		formStage: z.number().optional(),
		securityKey: z.string().optional(),

		// Section 1
		email: z
			.string()
			.email({ message: "Please enter a valid email address." })
			.min(1, {
				message: "Email is required",
			}),
		full_name: z.string().min(1, { message: "Name is required" }).toUpperCase(),
		staff_id: z.string().min(1, { message: "Staff ID / Student No. is required" }),
		course: z.string().min(1, { message: "Designation / Course is required" }),
		faculty: z.string().min(1, { message: "Faculty is required" }),
		transport: z.string().min(1, { message: "Please select your transport type." }),
		travelling: z.string().min(1, { message: "Please choose an item." }),
		other_members: z.string().optional(),

		// Section 2
		program_title: z
			.string()
			.min(1, { message: "Program / Event title is required" }),
		program_description: z.string().optional(),
		commencement_date: z
			.date({
				required_error: "Please select a date.",
				invalid_type_error: "Oops that's not a date!",
			})
			.min(today, { message: "Date must be today or in the future." }),
		completion_date: z
			.date()
			.refine(val => val >= today, {
				message: "Date must be today or in the future.",
			}),
		organiser: z.string().min(1, { message: "Organiser is required" }),
		venue: z.string().min(1, { message: "Venue is required" }),
		hrdf_claimable: z
			.string()
			.min(1, { message: "Please select one of the option." }),

		// Section 3
		flight_date: z.date({
			required_error: "Flight Date is required.",
			invalid_type_error: "Oops that's not a date!",
		}),
		flight_time: z.string().min(1, { message: "Flight time is required" }),
		flight_number: z.string().min(1, { message: "Flight number is required" }),
		destination_from: z.string().min(1, { message: "Destination is required" }),
		destination_to: z.string().min(1, { message: "Destination is required" }),
		check_in_date: z.date({
			required_error: "Check-in date is required.",
			invalid_type_error: "Oops that's not a date!",
		}),
		check_out_date: z.date({
			required_error: "Check-out date is required.",
			invalid_type_error: "Oops that's not a date!",
		}),
		hotel_name: z.string().min(1, { message: "Hotel is required" }),

		// // Section 4
		course_fee: z
			.number({
				required_error: "Course fee is required.",
				invalid_type_error: "Oops that's not a number!",
			})
			.nonnegative({ message: "Course fee cannot be negative value." }),
		airfare_fee: z
			.number({
				required_error: "Airfare fee is required.",
				invalid_type_error: "Oops that's not a number!",
			})
			.nonnegative({ message: "Airfare fee cannot be negative value." }),
		accommodation_fee: z
			.number({
				required_error: "Accommodation fee is required.",
				invalid_type_error: "Oops that's not a number!",
			})
			.nonnegative({ message: "Accommodation fee cannot be negative value." }),
		per_diem_fee: z
			.number({
				required_error: "Per diem fee is required.",
				invalid_type_error: "Oops that's not a number!",
			})
			.nonnegative({ message: "Per diem fee cannot be negative value." }),
		transportation_fee: z
			.number({
				required_error: "Transport fee is required.",
				invalid_type_error: "Oops that's not a number!",
			})
			.nonnegative({ message: "Transport fee cannot be negative value." }),
		travel_insurance_fee: z
			.number({
				required_error: "Travel insurance fee is required.",
				invalid_type_error: "Oops that's not a number!",
			})
			.nonnegative({ message: "Travel insurance cannot be negative value." }),
		other_fees: z
			.number({
				invalid_type_error: "Oops that's not a number!",
			})
			.nonnegative({ message: "Other fee cannot be negative value." }),
		grand_total_fees: z
			.number()
			.nonnegative({ message: "Total fee cannot be negative value." })
			.optional(),
		staff_development_fund: z.string().optional(),
		consolidated_pool_fund: z.string().optional(),
		research_fund: z.string().optional(),
		travel_fund: z.string().optional(),
		student_council_fund: z.string().optional(),
		other_funds: z.string().optional(),
		expenditure_cap: z.string().optional(),
		expenditure_cap_amount: z
			.number()
			.nonnegative({ message: "Expenditure cap cannot be negative value." })
			.optional(),

		// Section 5
		supporting_documents: z
			.instanceof(FileList)
			.optional()
			.nullable()
			.refine(
				fileList => {
					if (fileList) {
						for (let i = 0; i < fileList.length; i++) {
							if (fileList?.item(i)?.size! > MAX_FILE_SIZE) {
								return false;
							}
						}
					}
					return true;
				},
				{
					message: "All files must be smaller than 5MB.",
				},
			),

		// Section 6
		applicant_declaration_name: z
			.string()
			.min(1, { message: "Applicant name is required" }),
		applicant_declaration_position_title: z
			.string()
			.min(1, { message: "Position title is required" }),
		applicant_declaration_date: z.date({
			required_error: "Declaration date is required.",
			invalid_type_error: "Oops that's not a date!",
		}),
		applicant_declaration_signature: z.string(),

		// Section 7
		verification_name: z.string().optional(),
		verification_position_title: z.string().optional(),
		verification_signature: z.string().optional(),
		verification_date: z
			.date({
				required_error: "Date is required.",
				invalid_type_error: "Oops that's not a date!",
			})
			.optional(),

		// Section 8
		approval_name: z.string().optional(),
		approval_position_title: z.string().optional(),
		approval_signature: z.string().optional(),
		approval_date: z
			.date({
				required_error: "Date is required.",
				invalid_type_error: "Oops that's not a date!",
			})
			.optional(),

		// Section 9
		verification_email: z.string().min(1, { message: "Applicant email is required" }),
		approval_email: z.string().min(1, { message: "Applicant email is required" }),
	})
	.refine(
		data => {
			if (data.check_in_date && data.check_out_date) {
				return data.check_in_date <= data.check_out_date;
			}
			return true;
		},
		{
			message: "Check-in date must be before Check-out date.",
			path: ["check_in_date"],
		},
	)
	// if commencement date is before completion date, then return true
	// else return false
	.refine(
		data => {
			if (data.commencement_date && data.completion_date) {
				return data.commencement_date <= data.completion_date;
			}
			return true;
		},
		{
			message: "Commencement date must be before Completion date.",
			path: ["commencement_date"],
		},
	)
	// if travelling is in group, then other members is required
	// else return true
	.refine(
		data => {
			if (data.travelling === "group") {
				return data.other_members !== "";
			}
			return true;
		},
		{
			message: "Other members is required.",
			path: ["other_members"],
		},
	);

export default adminExternalFormSchema;
