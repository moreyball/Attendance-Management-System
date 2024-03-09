import React, { useEffect, useRef, useState } from "react";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import { IoSend } from "react-icons/io5";
import { FaUserCircle } from "react-icons/fa";
import stringSimilarity from "string-similarity";
import compromise from "compromise";
import OpenAI from "openai";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const Chatbot = () => {
    const [openChat, setOpenChat] = useState<boolean>(false);
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [isInitialMessage, setIsInitialMessage] = useState<boolean>(true);
    const supabase = createClientComponentClient();

    useEffect(() => {
        const sendInitialMessage = async () => {
            if (openChat && isInitialMessage) {
                setLoading(true);
                await new Promise(resolve => setTimeout(resolve, 3000));

                setLoading(false);
                setMessages((prevMessages) => [...prevMessages, `bee: Hi there! How can I help?`]);
                setIsInitialMessage(false);
            }
        };

        sendInitialMessage();
    }, [openChat, isInitialMessage]);

    const openai = new OpenAI({
        apiKey: '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',
        dangerouslyAllowBrowser: true
    });

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (message: string) => {
        if (inputValue.trim() === "") return;

        setLoading(true);
        setMessages((prevMessages) => [...prevMessages, `user: ${inputValue.trim()}`]);

        await new Promise(resolve => setTimeout(resolve, 3000));

        const response = await getChatbotResponse(message);

        setLoading(false);
        setMessages((prevMessages) => [...prevMessages, `bee: ${response}`]);
    };

    const getEventsForTimeRange = async (timeRange: string) => {
        const today = new Date();
        let startDate;
        let endDate;

        if (timeRange === "today") {
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
        } else if (timeRange === "week") {
            const currentDay = today.getDay();
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() - currentDay);
            endDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + (6 - currentDay) + 1);
        } else if (timeRange === "month") {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        } else if (timeRange === "year") {
            startDate = new Date(today.getFullYear(), 0, 1);
            endDate = new Date(today.getFullYear() + 1, 0, 0);
        } else {
            // Handle other cases or default behavior
            return "Sorry, I don't understand that time range.";
        }

        console.log(startDate, endDate);

        const { data, error } = await supabase
            .from("internal_events")
            .select("*")
            .gte("intFEventStartDate", startDate.toISOString())
            .lt("intFEventStartDate", endDate.toISOString())
            .eq("intFIsHidden", 0)
            .order("intFEventStartDate");

        if (error) {
            console.error("Error fetching events:", error);
            return "Sorry, there was an error fetching event information.";
        }

        const currentDate = new Date();
        const passedEvents = data.filter((event) => new Date(event.intFEventStartDate) < currentDate);
        const upcomingEvents = data.filter((event) => new Date(event.intFEventStartDate) >= currentDate);

        const eventCount = data.length || 0;
        return `There are a total of ${eventCount} events with ${passedEvents.length} completed and ${upcomingEvents.length} upcoming events for ${timeRange}.`;
    };

    const findMostSimilarKeywords = (userWords: string[], targetKeywords: string[], threshold: number) => {
        return userWords.map((word: string) => {
            const matches = stringSimilarity.findBestMatch(word, targetKeywords);
            console.log(matches.bestMatch.rating);
            return matches.bestMatch.rating >= threshold ? matches.bestMatch.target : null;
        });
    };

    const getTimeRangeKeyword = (mostSimilarKeywords: string[]) => {
        const timeRangeKeywords = ["today", "week", "year", "month"];
        const threshold = 0.15;

        const timeRange = findMostSimilarKeywords(mostSimilarKeywords, timeRangeKeywords, threshold)
            .filter(keyword => keyword !== null)[0];

        return timeRange || "this month";
    };

    const getChatbotResponse = async (question: string) => {
        const keywords = ["events", "month", "year", "today", "week", "products", "offer"];
        const userWords = compromise(question.toLowerCase()).out("array");

        const mostSimilarKeywords = findMostSimilarKeywords(userWords, keywords, 0.15);

        const hasEventsKeyword = mostSimilarKeywords.includes("events");
        const hasProductsKeyword = mostSimilarKeywords.includes("products") || mostSimilarKeywords.includes("offer");

        if (hasEventsKeyword) {
            const timeRange = getTimeRangeKeyword(userWords);
            return await getEventsForTimeRange(timeRange);
        } else if (hasProductsKeyword) {
            return "We offer a wide range of products including electronics, clothing, and accessories.";
        }

        const response = await getOpenAIResponse(question);
        return response;
    };

    const getOpenAIResponse = async (input: string) => {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "user", content: input }],
            model: "gpt-3.5-turbo",
        });
        console.log(completion);
        return completion.choices[0].message.content;
    };

    return (
        <div className="fixed bottom-0 right-5 z-[999] border-t-2 border-l-2 border-r-2 border-black rounded-t-md">
            {!openChat ? (
                <div className="px-4 cursor-pointer flex flex-row items-center justify-center p-2 bg-red-500 rounded-t-md w-[300px]" onClick={() => setOpenChat(true)}>
                    <IoChatbubbleEllipsesOutline className="text-white mt-[5px] mr-2" />
                    <p className="text-white text-[18px]">EMAT Bot</p>
                </div>
            ) : (
                <div className="w-[300px] h-[400px]">
                    <div className="flex flex-col h-full">
                        <div className="bg-red-500 h-[40px] rounded-t-md p-2 flex flex-row cursor-pointer items-center justify-center" onClick={() => setOpenChat(false)}>
                            <IoChatbubbleEllipsesOutline className="text-white mt-[5px] mr-2" />
                            <p className="text-white text-[18px]">EMAT Bot</p>
                        </div>

                        <div className="bg-slate-100 flex-1 overflow-y-auto p-2 pb-5">
                            {messages.map((msg, index) => (
                                <div key={index} className={msg.startsWith("user") ? "mb-5" : "text-left mb-5"}>
                                    {msg.startsWith("user") ? (
                                        <div className="flex items-center justify-end px-1">
                                            <div className="bg-slate-200 rounded-md p-2 w-8/12">
                                                {msg.replace("user:", "")}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center px-1">
                                            <FaUserCircle className="inline-block mr-2 text-slate-700 h-6 w-6" />
                                            <div className="bg-slate-200 rounded-md p-2 w-11/12">
                                                {msg.replace("bee:", "")}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                            {loading &&
                                <div className="flex items-center px-1">
                                    <FaUserCircle className="inline-block mr-2 text-slate-700 h-6 w-6" />
                                    <div className="bg-slate-200 rounded-md p-2 w-11/12 text-xs italic">
                                        Bee is typing...
                                    </div>
                                </div>
                            }
                            <div ref={messagesEndRef} />
                        </div>

                        <div className="bg-white h-[30px] flex items-center justify-center cursor-pointer ">
                            <input
                                type="text"
                                placeholder="Say something..."
                                className={`w-full focus:outline-none ml-2 mr-2 text-sm ${loading ? 'cursor-not-allowed' : 'cursor-text'}`}
                                value={inputValue}
                                disabled={loading}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyPress={async (e) => {
                                    if (e.key === "Enter") {
                                        setInputValue("");
                                        await handleSendMessage(inputValue.trim());
                                    }
                                }}
                            />
                            <IoSend
                                className="mr-2"
                                onClick={async () => {
                                    setInputValue("");
                                    await handleSendMessage(inputValue.trim());
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Chatbot;