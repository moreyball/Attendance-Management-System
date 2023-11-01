"use client"

import AddAdmin_Modal from "@/components/AddAdmin_Modal";

import filterBar from "@/public/images/filter_bar_black.png";
import exportCSV from "@/public/images/export_csv.png";
import arrowLeft from "@/public/images/arrow_left.png";
import arrowRight from "@/public/images/arrow_right.png";
import skipLeft from "@/public/images/skip_left.png";
import skipRight from "@/public/images/skip_right.png";
import { FaSortAlphaDown, FaSortAlphaUp, FaCalendarAlt, FaCheck } from 'react-icons/fa'; // Import icons from react-icons
import { IoMdRefresh, IoIosArrowBack, IoIosAddCircleOutline } from 'react-icons/io'; // Import icons from react-icons

import { useState } from 'react';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { auth, provider } from "../../../google_config";
import { signInWithPopup, createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function Home() {
    // All dummy data
    const originalData = [
        { id: 1, name: 'John Doe', role: 'Admin', createdAt: 'Jan 21, 2020', status: 'Completed' },
        { id: 2, name: 'Jane Doe', role: 'Editor', createdAt: 'Feb 10, 2020', status: 'On-going' },
        { id: 3, name: 'Sam Smith', role: 'User', createdAt: 'Mar 15, 2020', status: 'Canceled' },
        { id: 4, name: 'Emily Davis', role: 'Admin', createdAt: 'Apr 5, 2020', status: 'Completed' },
        { id: 5, name: 'Michael Johnson', role: 'Editor', createdAt: 'May 8, 2020', status: 'On-going' },
        { id: 6, name: 'Sarah Brown', role: 'User', createdAt: 'Jun 19, 2020', status: 'Canceled' },
        { id: 7, name: 'Chris Lee', role: 'Admin', createdAt: 'Jul 30, 2020', status: 'Completed' },
        { id: 8, name: 'Ava Wilson', role: 'Editor', createdAt: 'Aug 9, 2020', status: 'On-going' },
        { id: 9, name: 'Oliver Taylor', role: 'User', createdAt: 'Sep 14, 2020', status: 'Canceled' },
        { id: 10, name: 'John Doe', role: 'Admin', createdAt: 'Jan 21, 2020', status: 'Completed' },
        { id: 11, name: 'Jane Doe', role: 'Editor', createdAt: 'Feb 10, 2020', status: 'On-going' },
        { id: 12, name: 'Sam Smith', role: 'User', createdAt: 'Mar 15, 2020', status: 'Canceled' },
        { id: 13, name: 'Emily Davis', role: 'Admin', createdAt: 'Apr 5, 2020', status: 'Completed' },
        { id: 14, name: 'Michael Johnson', role: 'Editor', createdAt: 'May 8, 2020', status: 'On-going' },
        { id: 15, name: 'Sarah Brown', role: 'User', createdAt: 'Jun 19, 2020', status: 'Canceled' },
        { id: 16, name: 'Chris Lee', role: 'Admin', createdAt: 'Jul 30, 2020', status: 'Completed' },
        { id: 17, name: 'Ava Wilson', role: 'Editor', createdAt: 'Aug 9, 2020', status: 'On-going' },
    ];

    const [data, setData] = useState(originalData); // Filter the data
    const [entriesToShow, setEntriesToShow] = useState(10); // Show the entries
    const [searchQuery, setSearchQuery] = useState(''); // Search queries for search bar
    const [currentPage, setCurrentPage] = useState(1); // Define state for current page
    const [activePage, setActivePage] = useState(1); // Define state for active page
    const [sortBy, setSortBy] = useState(''); // Initialize state for sorting
    const [sortOrder, setSortOrder] = useState('asc'); // Initialize sort order (asc or desc)
    const [showSortOptions, setShowSortOptions] = useState(false); // State to control dropdown visibility

    const [showModalAddAdmin, setShowModalAddAdmin] = useState(false);

    // handle search input
    const handleSearch = (query) => {
        setSearchQuery(query);
        const filteredData = originalData.filter(item =>
            item.name.toLowerCase().includes(query.toLowerCase()) ||
            item.role.toLowerCase().includes(query.toLowerCase()) ||
            item.createdAt.toLowerCase().includes(query.toLowerCase()) ||
            item.status.toLowerCase().includes(query.toLowerCase())
        );
        setData(filteredData);
    };

    // export to CSV format
    const exportToCSV = () => {
        const csvContent = originalData.map(e => Object.values(e).join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");

        link.href = URL.createObjectURL(blob);
        link.setAttribute("download", "originalData.csv");
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
        if (currentPage < Math.ceil(data.length / entriesToShow)) {
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
        const lastPage = Math.ceil(data.length / entriesToShow);
        setCurrentPage(lastPage);
        setActivePage(lastPage);
    };

    // Function to handle pagination button click
    const handlePageClick = (pageNumber) => {
        setCurrentPage(pageNumber);
        setActivePage(pageNumber);
    };


    // Show Sort Options
    const handleSortButtonClick = () => {
        setShowSortOptions(!showSortOptions); // Toggle dropdown visibility
    };

    // Toggle sort order between 'asc' and 'desc' when ID is selected
    const handleSortButtonMenuClick = () => {
        if (sortBy === 'name') {
            // If it's already sorted by name, toggle between 'asc' and 'desc'
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            // Set the sorting option to name and default to 'asc'
            setSortBy('name');
            setSortOrder('asc');
        }
        setShowSortOptions(false);
    };

    // An array of sorting options
    const sortOptions = [
        { label: 'ID', value: 'name' },
        { label: 'Role', value: 'role' },
        { label: 'Created At', value: 'createdAt' },
        { label: 'Status', value: 'status' },
    ];

    // Modify the sorting logic based on the selected option and sort order
    const sortedData = data.slice().sort((a, b) => {
        if (sortBy === 'name') {
            // Sort by ID
            if (sortOrder === 'asc') {
                return a.id - b.id;
            } else {
                return b.id - a.id;
            }
        }
        return 0;
    });


    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [value, setValue] = useState<string | null>(null);
    const [errorMessageEmailAddress, setErrorMessageEmailAddress] = useState<string | null>(null);
    const [errorMessagePassword, setErrorMessagePassword] = useState<string | null>(null);
    const [errorMessageConfirmPassword, setErrorMessageConfirmPassword] = useState<string | null>(null);
    const [successMessageEmailVerification, setSuccessMessageEmailVerification] = useState<string | null>(null);

    const supabase = createClientComponentClient();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const toggleConfirmPasswordVisibility = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };


    const handleCreateAccount = async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const confirmPassword = e.target.confirmPassword.value;

        if (password.length >= 6) {
            setErrorMessagePassword(null); // Clear password error message if length is >= 6
        }

        if (password === confirmPassword) {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                const user = userCredential.user;
                const email_address = user.email;

                await sendEmailVerification(user);
                setErrorMessageConfirmPassword(null);
                console.log("Email verification sent!");
                setSuccessMessageEmailVerification("Email verification sent. Please check your inbox.");

                // Retrieve firebase_uid from Firebase Authentication
                const userId = user.uid;

                // Check if the user with this firebase_uid already exists in Supabase
                const { data, error } = await supabase
                    .from('login')
                    .select('firebase_uid, email_address')
                    .eq('firebase_uid', userId);

                if (error) {
                    console.error('Error fetching user data:', error.message);
                    return;
                }

                if (data && data.length > 0) {
                    // User with this firebase_uid already exists, handle it accordingly
                    console.log('User with this firebase_uid already exists:', data);
                } else {
                    // User with this firebase_uid does not exist, proceed with inserting it
                    const { data, error } = await supabase
                        .from('login')
                        .upsert([{ firebase_uid: userId, email_address: email }]);

                    if (error) {
                        console.error('Error inserting data into Supabase:', error.message);
                    }
                }

            } catch (error) {
                // Handle Firebase authentication errors
                if (error.code === 'auth/email-already-in-use') {
                    setErrorMessageEmailAddress("Email is already in use.");
                    setErrorMessagePassword(null);
                    setErrorMessageConfirmPassword(null);
                } else if (error.code === 'auth/weak-password') {
                    setErrorMessagePassword("Password must be at least 6 characters.");
                } else if (error.code === 'auth/invalid-email') {
                    setErrorMessageEmailAddress("Invalid email address.");
                } else {
                    console.error('Sign-up error: ', error);
                }
            }
        } else {
            setErrorMessageConfirmPassword("Passwords do not match.");
        }
    }


    const handlePasswordChange = (e) => {
        const password = e.target.value;

        if (password.length >= 6) {
            setErrorMessagePassword(null); // Clear password error message if length is >= 6
        }
    }

    const handleConfirmPasswordChange = (e) => {
        const confirmPassword = e.target.value;
        const password = document.getElementById('password').value;

        if (password === confirmPassword) {
            setErrorMessageConfirmPassword(null);
        } else {
            setErrorMessageConfirmPassword("Passwords do not match.");
        }
    };

    return (
        <div className="h-screen flex flex-row justify-start bg-slate-100">

            <AddAdmin_Modal isVisible={showModalAddAdmin} onClose={() => setShowModalAddAdmin(false)}>
                <form onSubmit={(e) => handleCreateAccount(e)}>

                    <div className="mb-[0px] lg:mb-[20px] mt-[30px] dark:bg-dark_mode_card">
                        <div className="mx-auto max-w-xs ">
                            <p className="text-2xl font-medium mb-6 text-center">Create an Account</p>
                            <input
                                className="w-full px-8 py-4 pl-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white"
                                type="email" placeholder="Email address" name="email" required />
                            <p className="text-red-500 text-left ml-2 mt-1 text-sm">{errorMessageEmailAddress}</p>

                            <div className="relative">
                                <input
                                    className="w-full px-8 py-4 pl-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5"
                                    type={showPassword ? 'password' : 'text'} placeholder="Random password" id="password" name="password" required onChange={handlePasswordChange} />
                                <button className="btn btn-outline-secondary absolute top-4 right-0 mt-5 mr-4" type="button"
                                    id="password-toggle" onClick={togglePasswordVisibility}>
                                    {showPassword ? <FaEyeSlash style={{ fontSize: '20px' }} /> : <FaEye style={{ fontSize: '20px' }} />}
                                </button>

                                <p className="text-red-500 text-left ml-2 mt-1 text-sm">{errorMessagePassword}</p>
                            </div>
                            <div className="relative">
                                <input
                                    className="w-full px-8 py-4 pl-4 rounded-lg font-medium bg-gray-100 border border-gray-200 placeholder-gray-500 text-sm focus:outline-none focus:border-gray-400 focus:bg-white mt-5"
                                    type={showConfirmPassword ? 'password' : 'text'}
                                    placeholder="Confirm random password"
                                    id="confirmPassword"
                                    onChange={handleConfirmPasswordChange}
                                    required
                                />

                                <button className="btn btn-outline-secondary absolute top-4 right-0 mt-5 mr-4" type="button"
                                    id="confirm-password-toggle" onClick={toggleConfirmPasswordVisibility}>
                                    {showConfirmPassword ? <FaEyeSlash style={{ fontSize: '20px' }} /> : <FaEye style={{ fontSize: '20px' }} />}
                                </button>

                                <p className="text-red-500 text-left ml-2 mt-1 text-sm">{errorMessageConfirmPassword}</p>
                                <p className="text-green-500 text-left ml-2 mt-1 text-sm">{successMessageEmailVerification}</p>
                            </div>
                            <button
                                className="mt-10 tracking-wide font-semibold bg-slate-800 text-gray-100 w-full py-4 rounded-lg hover:bg-slate-900 transition-all duration-300 ease-in-out flex items-center justify-center focus:shadow-outline focus:outline-none">
                                <svg className="w-6 h-6 -ml-2" fill="none" stroke="currentColor" strokeWidth="2"
                                    strokeLinecap="round" strokeLinejoin="round">
                                </svg>
                                <span className="mr-4 text-[16px]">
                                    Register
                                </span>
                            </button>
                        </div>
                    </div>

                </form>
            </AddAdmin_Modal >

            <div className="flex-1 mx-auto px-4 sm:px-[26px] py-[26px] bg-slate-100">
                <div className="bg-white rounded p-8">
                    <div className="inline-flex">
                        <span className="mt-[7px]"><a href="/homepage"><IoIosArrowBack className="text-2xl -mt-[1.5px] mr-[6px] text-slate-800 -ml-1" /></a></span>
                        <p className="text-xl lg:text-2xl font-bold"><span className="ml-[5px] text-slate-800">Admin Registration</span></p>
                    </div>

                    <div className="flex items-center justify-between mb-8 mt-5">
                        {/* Refresh Button */}
                        <button
                            type="button"
                            className="items-center bg-slate-200 rounded-lg py-2 px-4 font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-sm md:inline-flex hidden hover:transition duration-300 transform hover:scale-105">
                            <IoMdRefresh className="text-xl text-slate-800" />
                            <span className="ml-2 -mt-[1.25px] text-slate-800">
                                Refresh
                            </span>
                        </button>

                        <div className="flex items-center">

                            {/* Search Input */}
                            <div className="max-w-full relative shadow hover:shadow-sm border border-slate-300 rounded mr-3">
                                <span className="h-full absolute inset-y-0 left-0 flex items-center pl-2">
                                    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current text-gray-500">
                                        <path
                                            d="M10 4a6 6 0 100 12 6 6 0 000-12zm-8 6a8 8 0 1114.32 4.906l5.387 5.387a1 1 0 01-1.414 1.414l-5.387-5.387A8 8 0 012 10z">
                                        </path>
                                    </svg>
                                </span>
                                <input
                                    placeholder="Search here..."
                                    className="appearance-none rounded-md block pl-8 pr-6 py-2 bg-white text-sm placeholder-gray-400 text-gray-700 focus:bg-white focus:placeholder-gray-600 focus:text-gray-700 focus:outline-none"
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                />
                            </div>

                            {/* Sort By Button */}
                            <button
                                type="button"
                                className="flex items-center justify-center bg-slate-200 rounded-lg py-2 px-4 font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 mr-3 shadow-sm md:inline-flex hidden"
                                onClick={handleSortButtonClick}
                            >
                                <img src={filterBar.src} alt="" width={20} className="text-slate-800" />
                                <span className="ml-2 text-slate-800">Sort By</span>
                            </button>

                            {/* Dropdown Menu */}
                            <div
                                className={`absolute top-[150px] right-0 transform translate-x-0 translate-y-0 transition-transform duration-300 ease-in-out ${showSortOptions ? 'translate-x-0' : ''}`}
                                style={{ zIndex: 999 }}
                            >
                                {showSortOptions && (
                                    <div className="bg-white border-l border-t border-r border-gray-200 shadow-md w-56 rounded-lg">
                                        <ul>
                                            <li className="px-4 py-2 cursor-pointer flex items-center text-gray-600">
                                                <span className="font-bold text-slate-800">Sort By:</span>
                                            </li>
                                            {sortOptions.map((option) => (
                                                <li
                                                    key={option.value}
                                                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 flex items-center transition-all duration-200 ease-in-out font-medium"
                                                    onClick={() => {
                                                        handleSortButtonMenuClick(); // Hide the dropdown when an option is selected
                                                        setSortBy(option.value); // Set the sorting option
                                                    }}
                                                >
                                                    {option.value === 'name' && <FaSortAlphaDown className="mr-3 ml-2 text-slate-800" />}
                                                    {option.value === 'role' && <FaSortAlphaUp className="mr-3 ml-2 text-slate-800" />}
                                                    {option.value === 'createdAt' && <FaCalendarAlt className="mr-3 ml-2 text-slate-800" />}
                                                    {option.value === 'status' && <FaCheck className="mr-3 ml-2 text-slate-800" />}
                                                    <span className="text-slate-500 ">{option.label}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Add Admin Button */}
                            <button
                                type="button"
                                className="flex items-center justify-center bg-slate-200 rounded-lg py-2 px-4 font-medium hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300 shadow-sm md:inline-flex hidden" onClick={() => setShowModalAddAdmin(true)}>
                                <IoIosAddCircleOutline className="text-2xl text-slate-800" />
                                <span className="ml-2 -mt-[1.25px] text-slate-800">New Admin</span>
                            </button>

                        </div>
                    </div>

                    <div className="-mx-4 sm:-mx-8 px-4 sm:px-8 py-4 overflow-x-auto">
                        <div className="inline-block min-w-full shadow rounded-sm overflow-hidden">
                            <table className="min-w-full leading-normal">
                                {/* Table Header */}
                                <thead>
                                    <tr>
                                        <th className="px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                            ID
                                        </th>
                                        <th className="px-[33px] py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-[21px] py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                            Rol
                                        </th>
                                        <th className="px-[21px] py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                            Created at
                                        </th>
                                        <th className="px-8 py-3 border-b-2 border-gray-200 bg-gray-100 text-left text-xs lg:text-sm font-semibold text-gray-600 uppercase tracking-wider">
                                            Status
                                        </th>
                                    </tr>
                                </thead>

                                {/* Table Body */}
                                <tbody>
                                    {sortedData.slice((currentPage - 1) * entriesToShow, currentPage * entriesToShow).map((item, index) => (
                                        <tr key={index}>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm w-[33px]">
                                                <div className="flex items-center">
                                                    <div className="ml-[14px]">
                                                        <p className="text-gray-900 whitespace-no-wrap">
                                                            {item.id}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm w-[33px]">
                                                <p className="text-gray-900 whitespace-no-wrap ml-3">{item.name}</p>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm w-[21px]">
                                                <p className="text-gray-900 whitespace-no-wrap">{item.role}</p>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm w-[21px]">
                                                <p className="text-gray-900 whitespace-no-wrap ml-1">
                                                    {item.createdAt}
                                                </p>
                                            </td>
                                            <td className={`px-5 py-5 border-b border-gray-200 bg-white text-xs lg:text-sm w-[8px]`}>
                                                <span className={`relative inline-block px-3 py-2 font-semibold text-${item.status === 'Completed' ? 'green' : item.status === 'On-going' ? 'orange' : 'red'}-900 leading-tight`}>
                                                    <span aria-hidden className={`absolute inset-0 bg-${item.status === 'Completed' ? 'green' : item.status === 'On-going' ? 'orange' : 'red'}-200 opacity-50 rounded-full`}></span>
                                                    <span className="relative">{item.status}</span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}

                                    {Array.from({ length: entriesToShow - data.length }).map((_, index) => (
                                        <tr key={index} className="invisible">
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm w-[33px]">
                                                <div className="flex items-center">
                                                    <div className="ml-[14px]">
                                                        <p className="text-gray-900 whitespace-no-wrap"></p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm w-[33px]">
                                                <p className="text-gray-900 whitespace-no-wrap ml-3"></p>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm w-[21px]">
                                                <p className="text-gray-900 whitespace-no-wrap"></p>
                                            </td>
                                            <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm w-[21px]">
                                                <p className="text-gray-900 whitespace-no-wrap ml-1"></p>
                                            </td>
                                            <td className={`px-5 py-5 border-b border-gray-200 bg-white text-sm w-[8px]`}>
                                                <span className={`relative inline-block px-3 py-2 font-semibold text-gray-900 leading-tight`}>
                                                    <span aria-hidden className={`absolute inset-0 opacity-0 rounded-full`}></span>
                                                    <span className="relative"></span>
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <div className="px-5 py-5 bg-white border-t flex items-center justify-between">
                                <div className="flex items-center text-[14px] text-base">
                                    <div className="mr-2 ml-3">
                                        <span className="text-sm lg:text-base">Show</span>
                                    </div>

                                    {/* Filter By How Many Entries */}
                                    <div className="relative mr-2">
                                        <select
                                            value={entriesToShow}
                                            onChange={(e) => setEntriesToShow(parseInt(e.target.value))}
                                            className="appearance-none h-full rounded-l border block bg-white border-gray-400 text-gray-700 py-2 px-4 pr-8 leading-tight focus:outline-none focus:bg-white focus:border-gray-500 text-sm lg:text-base">
                                            <option value={5} className="text-sm lg:text-base">5</option>
                                            <option value={10} className="text-sm lg:text-base">10</option>
                                            <option value={20} className="text-sm lg:text-base">20</option>
                                        </select>
                                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                                            <svg
                                                className="fill-current h-4 w-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                viewBox="0 0 20 20">
                                                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div>
                                        <span className="text-sm lg:text-base">entries</span>
                                    </div>
                                </div>
                                <div className="flex items-center">
                                    <span className="text-sm lg:text-base lg:text-[14px] lg:text-gray-900 lg:mr-2 hidden md:inline">
                                        1-{entriesToShow} of {data.length} entries
                                    </span>

                                    <div className="flex">

                                        {/* Skip To First Page Button */}
                                        <button
                                            type="button"
                                            className="py-2 px-1 ml-8"
                                            onClick={handleSkipToFirstPage}
                                            disabled={currentPage === 1}
                                            style={{
                                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                                opacity: currentPage === 1 ? 0.5 : 1
                                            }}
                                        >
                                            <img src={skipLeft.src} alt="" width={20} className="lg:w-[22px]" />
                                        </button>

                                        {/* Arrow Previous Page Button */}
                                        <button
                                            type="button"
                                            className="py-2 px-1 ml-5"
                                            onClick={handleArrowLeftClick}
                                            disabled={currentPage === 1}
                                            style={{
                                                opacity: currentPage === 1 ? 0.5 : 1
                                            }}
                                        >
                                            <img src={arrowLeft.src} alt="" width={12} className="lg:w-[13px]" />
                                        </button>

                                        {/* Pagination Buttons */}
                                        <div className="flex">
                                            {[1, 2, 3, 4, 5].map((pageNumber) => (
                                                <button
                                                    type="button"
                                                    className={`py-1 px-3 ml-5 rounded font-medium text-sm lg:text-[15px] ${pageNumber === activePage ? 'text-slate-100 bg-slate-900' : 'text-slate-800 bg-slate-200'}`}
                                                    key={pageNumber}
                                                    onClick={() => {
                                                        if (pageNumber <= Math.ceil(data.length / entriesToShow)) {
                                                            handlePageClick(pageNumber);
                                                        }
                                                    }}
                                                >
                                                    {pageNumber}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Arrow Next Page Button */}
                                        <button
                                            type="button"
                                            className="py-2 px-1 ml-5"
                                            onClick={handleArrowRightClick}
                                            disabled={currentPage === Math.ceil(data.length / entriesToShow)}
                                            style={{
                                                opacity: currentPage === Math.ceil(data.length / entriesToShow) ? 0.5 : 1
                                            }}>
                                            <img src={arrowRight.src} alt="" width={12} className="lg:w-[13px]" />
                                        </button>

                                        {/* Skip To Last Page Button */}
                                        <button
                                            type="button"
                                            className={`py-2 px-1 ml-5 ${currentPage === Math.ceil(data.length / entriesToShow) ? 'pointer-events-none opacity-50' : ''}`}
                                            onClick={handleSkipToLastPage}
                                        >
                                            <img src={skipRight.src} alt="" width={17} className="lg:w-[18px]" />
                                        </button>

                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </div >
    )

    { /* dont delete this, it will have funny bugs if you delete it */ }
    {/* <tbody>
<tr>
    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
      <div className="flex items-center">

        <div className="ml-3">
          <p className="text-gray-900 whitespace-no-wrap">
            Blake Bowman
          </p>
        </div>
      </div>
    </td>
    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
      <p className="text-gray-900 whitespace-no-wrap">Editor</p>
    </td>
    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
      <p className="text-gray-900 whitespace-no-wrap">
        Jan 01, 2020
      </p>
    </td>
    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
      <span className="relative inline-block px-3 py-1 font-semibold text-green-900 leading-tight">
        <span aria-hidden className="absolute inset-0 bg-green-200 opacity-50 rounded-full"></span>
        <span className="relative">Completed</span>
      </span>
    </td>
  </tr>
  <tr>
    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
      <div className="flex items-center">

        <div className="ml-3">
          <p className="text-gray-900 whitespace-no-wrap">
            Dana Moore
          </p>
        </div>
      </div>
    </td>
    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
      <p className="text-gray-900 whitespace-no-wrap">Editor</p>
    </td>
    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
      <p className="text-gray-900 whitespace-no-wrap">
        Jan 10, 2020
      </p>
    </td>
    <td className="px-5 py-5 border-b border-gray-200 bg-white text-sm">
      <span className="relative inline-block px-3 py-1 font-semibold text-orange-900 leading-tight">
        <span aria-hidden className="absolute inset-0 bg-orange-200 opacity-50 rounded-full"></span>
        <span className="relative">On-going</span>
      </span>
    </td>
  </tr>
  <tr>
    <td className="px-5 py-5 bg-white text-sm">
      <div className="flex items-center">

        <div className="ml-3">
          <p className="text-gray-900 whitespace-no-wrap">
            Alonzo Cox
          </p>
        </div>
      </div>
    </td>
    <td className="px-5 py-5 bg-white text-sm">
      <p className="text-gray-900 whitespace-no-wrap">Admin</p>
    </td>
    <td className="px-5 py-5 bg-white text-sm">
      <p className="text-gray-900 whitespace-no-wrap">Jan 18, 2020</p>
    </td>
    <td className="px-5 py-5 bg-white text-sm">
      <span className="relative inline-block px-3 py-1 font-semibold text-red-900 leading-tight">
        <span aria-hidden className="absolute inset-0 bg-red-200 opacity-50 rounded-full"></span>
        <span className="relative">Canceled</span>
      </span>
    </td>
  </tr>
</tbody>  */}
}

