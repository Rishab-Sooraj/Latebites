"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function TestAuthPage() {
    const [status, setStatus] = useState<string>("Checking...");
    const [details, setDetails] = useState<any>(null);

    useEffect(() => {
        async function checkAuth() {
            try {
                const supabase = createClient();

                // Test 1: Check if Supabase client is initialized
                setStatus("✅ Supabase client created");

                // Test 2: Check environment variables
                const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
                const hasKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

                setDetails({
                    envVars: {
                        url: hasUrl ? "✅ Present" : "❌ Missing",
                        key: hasKey ? "✅ Present" : "❌ Missing",
                    }
                });

                // Test 3: Try to get session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    setStatus(`❌ Session Error: ${sessionError.message}`);
                    return;
                }

                setDetails((prev: any) => ({
                    ...prev,
                    session: session ? "✅ Active session" : "⚠️ No session",
                    user: session?.user?.email || "Not logged in"
                }));

                // Test 4: Try to query a table
                const { data, error } = await supabase
                    .from('customers')
                    .select('id')
                    .limit(1);

                if (error) {
                    setDetails((prev: any) => ({
                        ...prev,
                        dbAccess: `❌ DB Error: ${error.message}`
                    }));
                } else {
                    setDetails((prev: any) => ({
                        ...prev,
                        dbAccess: "✅ Database accessible"
                    }));
                }

                setStatus("✅ All checks complete");

            } catch (err: any) {
                setStatus(`❌ Error: ${err.message}`);
                setDetails({ error: err.toString() });
            }
        }

        checkAuth();
    }, []);

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-8">
                <h1 className="text-3xl font-bold mb-6">Auth Diagnostics</h1>

                <div className="mb-6">
                    <h2 className="text-xl font-semibold mb-2">Status:</h2>
                    <p className="text-lg">{status}</p>
                </div>

                {details && (
                    <div>
                        <h2 className="text-xl font-semibold mb-2">Details:</h2>
                        <pre className="bg-gray-100 p-4 rounded overflow-auto">
                            {JSON.stringify(details, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
