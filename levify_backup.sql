--
-- PostgreSQL database dump
--

\restrict agyYFUSvMAiTgbT1dz0XO9wrgDS76DtJ4cIguVvLeX8iuW6teVq16waXF7K7W5C

-- Dumped from database version 16.11
-- Dumped by pg_dump version 16.11

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: approval_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.approval_history (
    id integer NOT NULL,
    leave_application_id integer NOT NULL,
    approver_id integer NOT NULL,
    approver_role character varying(20) NOT NULL,
    action character varying(20) NOT NULL,
    remarks text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT approval_history_action_check CHECK (((action)::text = ANY ((ARRAY['approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.approval_history OWNER TO postgres;

--
-- Name: approval_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.approval_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.approval_history_id_seq OWNER TO postgres;

--
-- Name: approval_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.approval_history_id_seq OWNED BY public.approval_history.id;


--
-- Name: leave_applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_applications (
    id integer NOT NULL,
    employee_id character varying(50) NOT NULL,
    application_number character varying(50) NOT NULL,
    leave_type character varying(100) NOT NULL,
    leave_location character varying(255),
    start_date date NOT NULL,
    end_date date NOT NULL,
    days_count numeric(5,2) NOT NULL,
    reason text,
    monetize_credits boolean DEFAULT false,
    commutation_requested boolean DEFAULT false,
    status character varying(50) DEFAULT 'pending'::character varying,
    current_approver character varying(20),
    hr_remarks text,
    hr_action_date timestamp without time zone,
    hr_action_by integer,
    ovcaa_remarks text,
    ovcaa_action_date timestamp without time zone,
    ovcaa_action_by integer,
    ovcaf_remarks text,
    ovcaf_action_date timestamp without time zone,
    ovcaf_action_by integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    monetization_days numeric DEFAULT 0
);


ALTER TABLE public.leave_applications OWNER TO postgres;

--
-- Name: leave_applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_applications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_applications_id_seq OWNER TO postgres;

--
-- Name: leave_applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_applications_id_seq OWNED BY public.leave_applications.id;


--
-- Name: leave_attachments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_attachments (
    id integer NOT NULL,
    leave_application_id integer NOT NULL,
    file_name character varying(255) NOT NULL,
    file_path character varying(500) NOT NULL,
    file_size integer,
    file_type character varying(100),
    uploaded_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.leave_attachments OWNER TO postgres;

--
-- Name: leave_attachments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.leave_attachments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.leave_attachments_id_seq OWNER TO postgres;

--
-- Name: leave_attachments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.leave_attachments_id_seq OWNED BY public.leave_attachments.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id integer NOT NULL,
    user_id integer NOT NULL,
    leave_application_id integer,
    type character varying(50) NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id integer NOT NULL,
    employee_id character varying(50) NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    full_name character varying(255) NOT NULL,
    department character varying(100),
    "position" character varying(100),
    employment_type character varying(50),
    role character varying(20) NOT NULL,
    vacation_leave_balance numeric(5,2) DEFAULT 15.00,
    sick_leave_balance numeric(5,2) DEFAULT 15.00,
    special_privilege_leave_balance numeric(5,2) DEFAULT 3.00,
    forced_leave_balance numeric(5,2) DEFAULT 5.00,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    employee_type character varying(20),
    salary_grade integer DEFAULT 0,
    total_leave_credits numeric(10,2) DEFAULT 0,
    total_leave_availed numeric(10,2) DEFAULT 0,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['employee'::character varying, 'hr'::character varying, 'ovcaa'::character varying, 'ovcaf'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_backup; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users_backup (
    id integer,
    employee_id character varying(50),
    email character varying(255),
    password character varying(255),
    full_name character varying(255),
    department character varying(100),
    "position" character varying(100),
    employment_type character varying(50),
    role character varying(20),
    vacation_leave_balance numeric(5,2),
    sick_leave_balance numeric(5,2),
    special_privilege_leave_balance numeric(5,2),
    forced_leave_balance numeric(5,2),
    created_at timestamp without time zone,
    updated_at timestamp without time zone,
    employee_type character varying(20),
    salary_grade integer,
    total_leave_credits numeric(10,2),
    total_leave_availed numeric(10,2)
);


ALTER TABLE public.users_backup OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: approval_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_history ALTER COLUMN id SET DEFAULT nextval('public.approval_history_id_seq'::regclass);


--
-- Name: leave_applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_applications ALTER COLUMN id SET DEFAULT nextval('public.leave_applications_id_seq'::regclass);


--
-- Name: leave_attachments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_attachments ALTER COLUMN id SET DEFAULT nextval('public.leave_attachments_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Data for Name: approval_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.approval_history (id, leave_application_id, approver_id, approver_role, action, remarks, created_at) FROM stdin;
1	1	1	hr	rejected		2026-05-15 14:58:07.179104
2	1	1	hr	rejected		2026-05-15 14:58:10.819544
3	2	1	hr	rejected		2026-05-15 19:22:00.665014
4	2	1	hr	rejected		2026-05-15 19:22:06.63043
5	3	1	hr	rejected		2026-05-15 19:38:26.376567
6	4	1	hr	approved	test	2026-05-23 18:33:18.840875
7	4	2	ovcaa	approved	testing can proceed	2026-05-23 18:34:58.284758
8	4	3	ovcaf	approved	can leave testing	2026-05-23 18:35:23.361829
9	5	1	hr	approved	testing proceed	2026-06-24 12:42:04.786792
10	5	2	ovcaa	approved	testing proceed to ovcaf	2026-06-24 12:43:20.132699
11	5	3	ovcaf	approved	approved. testing	2026-06-24 12:43:54.886431
12	6	1	hr	approved	test from hr	2026-07-09 18:54:24.247677
13	6	2	ovcaa	approved	ovcaa test	2026-07-09 18:56:10.662168
14	6	3	ovcaf	approved	ovcaf test	2026-07-09 18:56:52.157561
15	7	1	hr	approved	test web	2026-07-11 19:38:20.178589
16	7	2	ovcaa	approved	test web	2026-07-11 19:38:34.55528
17	7	3	ovcaf	approved	test web	2026-07-11 19:38:52.090205
18	8	1	hr	approved	testing	2026-07-11 19:52:51.140564
19	8	2	ovcaa	approved	testing	2026-07-11 19:53:02.203971
20	8	3	ovcaf	approved	testing	2026-07-11 19:53:14.786246
21	9	1	hr	approved	test	2026-07-11 20:28:30.904436
22	9	2	ovcaa	approved	test	2026-07-11 20:28:42.189212
23	9	3	ovcaf	approved	test	2026-07-11 20:28:55.590966
24	10	1	hr	approved	mobile test	2026-07-13 20:59:26.433766
25	10	2	ovcaa	approved	mobile test	2026-07-13 20:59:49.694651
26	10	3	ovcaf	approved	mobile test	2026-07-13 21:00:21.305124
\.


--
-- Data for Name: leave_applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_applications (id, employee_id, application_number, leave_type, leave_location, start_date, end_date, days_count, reason, monetize_credits, commutation_requested, status, current_approver, hr_remarks, hr_action_date, hr_action_by, ovcaa_remarks, ovcaa_action_date, ovcaa_action_by, ovcaf_remarks, ovcaf_action_date, ovcaf_action_by, created_at, updated_at, monetization_days) FROM stdin;
1	EMP110	LA-1778825957233-EMP110	Vacation Leave	\N	2026-05-15	2026-05-15	1.00	Testing	f	f	hr_rejected	\N		2026-05-15 14:58:10.817377	1	\N	\N	\N	\N	\N	\N	2026-05-15 14:19:17.234192	2026-05-15 14:58:10.817377	0
2	EMP110	LA-1778843561699-EMP110	Vacation Leave	\N	2026-05-15	2026-05-15	1.00	Testing	f	f	hr_rejected	\N		2026-05-15 19:22:06.628231	1	\N	\N	\N	\N	\N	\N	2026-05-15 19:12:41.700097	2026-05-15 19:22:06.628231	0
3	EMP110	LA-1778844286175-EMP110	Vacation Leave	\N	2026-05-15	2026-05-15	1.00	Testing	f	f	hr_rejected	\N		2026-05-15 19:38:26.369907	1	\N	\N	\N	\N	\N	\N	2026-05-15 19:24:46.177071	2026-05-15 19:38:26.369907	0
4	EMP001	LA-1779532356742-EMP001	Vacation Leave	\N	2026-05-23	2026-05-24	2.00	Testing	f	f	approved	\N	test	2026-05-23 18:33:18.834725	1	testing can proceed	2026-05-23 18:34:58.265459	2	can leave testing	2026-05-23 18:35:23.359749	3	2026-05-23 18:32:36.743481	2026-05-23 18:35:23.359749	0
5	EMP103	LV-2026-0005	Vacation Leave	within_ph	2026-06-24	2026-06-24	1.00	testing	f	f	approved	\N	testing proceed	2026-06-24 12:42:04.719359	1	testing proceed to ovcaf	2026-06-24 12:43:20.126917	2	approved. testing	2026-06-24 12:43:54.884633	3	2026-06-24 12:14:34.517905	2026-06-24 12:43:54.884633	0
6	EMP115	LA-1783591632357-EMP115	Sick Leave	\N	2026-07-09	2026-07-10	2.00	Testing	t	f	approved	\N	test from hr	2026-07-09 18:54:24.191155	1	ovcaa test	2026-07-09 18:56:10.654093	2	ovcaf test	2026-07-09 18:56:52.154557	3	2026-07-09 18:07:12.358912	2026-07-09 18:56:52.154557	0
7	EMP014	LV-2026-0007	Vacation Leave	within_ph	2026-07-13	2026-07-15	3.00	testing web	t	f	approved	\N	test web	2026-07-11 19:38:20.109386	1	test web	2026-07-11 19:38:34.550164	2	test web	2026-07-11 19:38:52.088677	3	2026-07-11 19:37:33.057762	2026-07-11 19:38:52.088677	0
8	EMP014	LV-2026-0008	Vacation Leave	within_ph	2026-07-15	2026-07-16	2.00	test	t	f	approved	\N	testing	2026-07-11 19:52:51.135642	1	testing	2026-07-11 19:53:02.198536	2	testing	2026-07-11 19:53:14.78492	3	2026-07-11 19:52:33.240912	2026-07-11 19:53:14.78492	0
9	EMP014	LV-2026-0009	Vacation Leave	within_ph	2026-07-13	2026-07-15	3.00	testing	t	f	approved	\N	test	2026-07-11 20:28:30.8996	1	test	2026-07-11 20:28:42.185065	2	test	2026-07-11 20:28:55.588982	3	2026-07-11 20:28:12.215364	2026-07-11 20:28:55.588982	0
10	EMP165	LA-1783947498944-EMP165	Vacation Leave	\N	2026-07-14	2026-07-14	1.00	Test mobile	t	f	approved	\N	mobile test	2026-07-13 20:59:26.316749	1	mobile test	2026-07-13 20:59:49.692269	2	mobile test	2026-07-13 21:00:21.303301	3	2026-07-13 20:58:18.945994	2026-07-13 21:00:21.303301	0
\.


--
-- Data for Name: leave_attachments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.leave_attachments (id, leave_application_id, file_name, file_path, file_size, file_type, uploaded_at) FROM stdin;
1	4	IMG_8125.png	uploads/leave-attachments/1779532356089-IMG_8125.png	137400	image/png	2026-05-23 18:32:36.762099
2	5	Yoga.jpg	uploads/leave-attachments/1782274474492-Yoga.jpg	41983	image/jpeg	2026-06-24 12:14:34.538809
3	6	IMG_8500.heic	uploads/leave-attachments/1783591630441-IMG_8500.heic	891579	image/heic	2026-07-09 18:07:12.411917
4	7	Cat03.jpg	uploads/leave-attachments/1783769853030-Cat03.jpg	236906	image/jpeg	2026-07-11 19:37:33.092283
5	8	Cat03.jpg	uploads/leave-attachments/1783770753221-Cat03.jpg	236906	image/jpeg	2026-07-11 19:52:33.24459
6	9	Cat03.jpg	uploads/leave-attachments/1783772892200-Cat03.jpg	236906	image/jpeg	2026-07-11 20:28:12.218694
7	10	IMG_8500.heic	uploads/leave-attachments/1783947498079-IMG_8500.heic	891579	image/heic	2026-07-13 20:58:19.041366
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, leave_application_id, type, title, message, is_read, created_at) FROM stdin;
1	1	2	leave_submitted	New Leave Application	A new leave application requires your review	t	2026-05-15 19:12:41.719106
2	1	3	leave_submitted	New Leave Application	A new leave application requires your review	t	2026-05-15 19:24:46.185136
3	1	4	leave_submitted	New Leave Application	A new leave application requires your review	t	2026-05-23 18:32:36.76983
8	4	4	status_update	Leave Application Update	🎉 Your leave application has been FULLY APPROVED!	t	2026-05-23 18:35:23.365148
6	4	4	status_update	Leave Application Update	Your leave application has been approved by OVCAA and forwarded to OVCAF	t	2026-05-23 18:34:58.286415
4	4	4	status_update	Leave Application Update	Your leave application has been approved by HR and forwarded to OVCAA	t	2026-05-23 18:33:18.845066
5	2	4	leave_for_review	Leave Application for Review	A leave application requires your review	t	2026-05-23 18:33:18.847218
7	3	4	leave_for_review	Leave Application for Review	A leave application requires your review	t	2026-05-23 18:34:58.287703
10	106	5	leave_submitted	Leave Application Submitted	Your leave application LV-2026-0005 has been submitted and is awaiting HR review.	f	2026-06-24 12:14:34.549147
9	1	5	leave_for_review	New Leave Application	A new leave application requires your review	t	2026-06-24 12:14:34.544587
11	106	5	hr_approved	✅ HR Approved	Your leave application (LV-2026-0005) has been approved by HR and forwarded to OVCAA for review.	f	2026-06-24 12:42:04.790822
13	106	5	ovcaa_approved	✅ OVCAA Approved	Your leave application (LV-2026-0005) has been approved by OVCAA and forwarded to OVCAF for final approval.	f	2026-06-24 12:43:20.135297
15	106	5	approved	🎉 Leave Fully Approved!	Congratulations! Your leave application (LV-2026-0005) has been FULLY APPROVED by OVCAF.	f	2026-06-24 12:43:54.88897
14	3	5	leave_for_review	Leave Application for Review	A leave application from Mario Fernandez requires your review.	t	2026-06-24 12:43:20.137715
12	2	5	leave_for_review	Leave Application for Review	A leave application from Mario Fernandez requires your review.	t	2026-06-24 12:42:04.792349
16	1	6	leave_submitted	New Leave Application	A new leave application requires your review	t	2026-07-09 18:07:12.416643
17	118	6	leave_submitted	Leave Application Submitted	Your leave application LA-1783591632357-EMP115 has been submitted and is awaiting HR review.	t	2026-07-09 18:07:12.419613
18	118	6	hr_approved	✅ HR Approved	Your leave application (LA-1783591632357-EMP115) has been approved by HR and forwarded to OVCAA for review.	t	2026-07-09 18:54:24.251956
19	2	6	leave_for_review	Leave Application for Review	A leave application from Edwin Lopez requires your review.	t	2026-07-09 18:54:24.253697
21	3	6	leave_for_review	Leave Application for Review	A leave application from Edwin Lopez requires your review.	t	2026-07-09 18:56:10.669003
22	118	6	approved	🎉 Leave Fully Approved!	Congratulations! Your leave application (LA-1783591632357-EMP115) has been FULLY APPROVED by OVCAF.	t	2026-07-09 18:56:52.162201
20	118	6	ovcaa_approved	✅ OVCAA Approved	Your leave application (LA-1783591632357-EMP115) has been approved by OVCAA and forwarded to OVCAF for final approval.	t	2026-07-09 18:56:10.666021
24	17	7	leave_submitted	Leave Application Submitted	Your leave application LV-2026-0007 has been submitted and is awaiting HR review.	t	2026-07-11 19:37:33.103788
29	17	7	approved	🎉 Leave Fully Approved!	Congratulations! Your leave application (LV-2026-0007) has been FULLY APPROVED by OVCAF.	t	2026-07-11 19:38:52.092327
27	17	7	ovcaa_approved	✅ OVCAA Approved	Your leave application (LV-2026-0007) has been approved by OVCAA and forwarded to OVCAF for final approval.	t	2026-07-11 19:38:34.557664
25	17	7	hr_approved	✅ HR Approved	Your leave application (LV-2026-0007) has been approved by HR and forwarded to OVCAA for review.	t	2026-07-11 19:38:20.182361
43	17	9	approved	🎉 Leave Fully Approved!	Congratulations! Your leave application (LV-2026-0009) has been FULLY APPROVED by OVCAF.	t	2026-07-11 20:28:55.593219
41	17	9	ovcaa_approved	✅ OVCAA Approved	Your leave application (LV-2026-0009) has been approved by OVCAA and forwarded to OVCAF for final approval.	t	2026-07-11 20:28:42.191545
39	17	9	hr_approved	✅ HR Approved	Your leave application (LV-2026-0009) has been approved by HR and forwarded to OVCAA for review.	t	2026-07-11 20:28:30.90718
38	17	9	leave_submitted	Leave Application Submitted	Your leave application LV-2026-0009 has been submitted and is awaiting HR review.	t	2026-07-11 20:28:12.224493
36	17	8	approved	🎉 Leave Fully Approved!	Congratulations! Your leave application (LV-2026-0008) has been FULLY APPROVED by OVCAF.	t	2026-07-11 19:53:14.787733
34	17	8	ovcaa_approved	✅ OVCAA Approved	Your leave application (LV-2026-0008) has been approved by OVCAA and forwarded to OVCAF for final approval.	t	2026-07-11 19:53:02.206576
32	17	8	hr_approved	✅ HR Approved	Your leave application (LV-2026-0008) has been approved by HR and forwarded to OVCAA for review.	t	2026-07-11 19:52:51.142948
31	17	8	leave_submitted	Leave Application Submitted	Your leave application LV-2026-0008 has been submitted and is awaiting HR review.	t	2026-07-11 19:52:33.262632
37	1	9	leave_for_review	New Leave Application	A new leave application requires your review	t	2026-07-11 20:28:12.221912
30	1	8	leave_for_review	New Leave Application	A new leave application requires your review	t	2026-07-11 19:52:33.247881
23	1	7	leave_for_review	New Leave Application	A new leave application requires your review	t	2026-07-11 19:37:33.100072
45	168	10	leave_submitted	Leave Application Submitted	Your leave application LA-1783947498944-EMP165 has been submitted and is awaiting HR review.	f	2026-07-13 20:58:19.063811
44	1	10	leave_submitted	New Leave Application	A new leave application requires your review	t	2026-07-13 20:58:19.05513
46	168	10	hr_approved	✅ HR Approved	Your leave application (LA-1783947498944-EMP165) has been approved by HR and forwarded to OVCAA for review.	f	2026-07-13 20:59:26.441754
47	2	10	leave_for_review	Leave Application for Review	A leave application from Andres Limos requires your review.	t	2026-07-13 20:59:26.445067
40	2	9	leave_for_review	Leave Application for Review	A leave application from Jasmine Ortega requires your review.	t	2026-07-11 20:28:30.910006
33	2	8	leave_for_review	Leave Application for Review	A leave application from Jasmine Ortega requires your review.	t	2026-07-11 19:52:51.146245
26	2	7	leave_for_review	Leave Application for Review	A leave application from Jasmine Ortega requires your review.	t	2026-07-11 19:38:20.183622
42	3	9	leave_for_review	Leave Application for Review	A leave application from Jasmine Ortega requires your review.	t	2026-07-11 20:28:42.194626
35	3	8	leave_for_review	Leave Application for Review	A leave application from Jasmine Ortega requires your review.	t	2026-07-11 19:53:02.211013
28	3	7	leave_for_review	Leave Application for Review	A leave application from Jasmine Ortega requires your review.	t	2026-07-11 19:38:34.561344
49	3	10	leave_for_review	Leave Application for Review	A leave application from Andres Limos requires your review.	t	2026-07-13 20:59:49.702065
48	168	10	ovcaa_approved	✅ OVCAA Approved	Your leave application (LA-1783947498944-EMP165) has been approved by OVCAA and forwarded to OVCAF for final approval.	t	2026-07-13 20:59:49.697017
50	168	10	approved	🎉 Leave Fully Approved!	Congratulations! Your leave application (LA-1783947498944-EMP165) has been FULLY APPROVED by OVCAF.	t	2026-07-13 21:00:21.308214
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, employee_id, email, password, full_name, department, "position", employment_type, role, vacation_leave_balance, sick_leave_balance, special_privilege_leave_balance, forced_leave_balance, created_at, updated_at, employee_type, salary_grade, total_leave_credits, total_leave_availed) FROM stdin;
118	EMP115	edwinlopez@msumain.edu.ph	password123	Edwin Lopez	College of Business Administration and Accountancy	Professor IV	Permanent	employee	100.79	100.79	3.00	5.00	2026-02-06 14:12:29.399468	2026-07-09 18:56:52.149562	teaching	27	201.58	62.00
112	EMP109	arnoldpineda@msumain.edu.ph	password123	Arnold Pineda	College of Agriculture	Asst. Prof. IV	Permanent	employee	32.50	32.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	18	65.00	30.00
119	EMP116	ginamorales@msumain.edu.ph	password123	Gina Morales	College of Business Administration and Accountancy	Assoc Prof. V	Permanent	employee	23.86	23.86	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	23	47.73	60.00
122	EMP119	benjaminaquino@msumain.edu.ph	password123	Benjamin Aquino	College of Business Administration and Accountancy	Assoc Prof. V	Permanent	employee	145.71	145.71	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	23	291.42	60.00
127	EMP124	almavalerio@msumain.edu.ph	password123	Alma Valerio	College of Information and Computing Sciences	Assoc Prof. V	Permanent	employee	64.08	64.08	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	23	128.17	105.00
6	EMP003	joseramirez@msumain.edu.ph	password123	Jose Ramirez	Human Resource Development Office	ADOF IV	Temporary	employee	85.33	85.33	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	15	220.67	50.00
7	EMP004	anavillanueva@msumain.edu.ph	password123	Ana Villanueva	Human Resource Development Office	TS I	Temporary	employee	42.88	42.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	11	104.75	19.00
8	EMP005	marklorenzo@msumain.edu.ph	password123	Mark Lorenzo	Human Resource Development Office	ADOF II	Temporary	employee	81.47	81.47	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	11	325.87	162.94
9	EMP006	carlamendoza@msumain.edu.ph	password123	Carla Mendoza	Human Resource Development Office	Training Specialst I	Permanent	employee	18.75	18.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	11	80.00	42.50
46	EMP043	arvinbalagtas@msumain.edu.ph	password123	Arvin Balagtas	Cultural Affairs Office	Comm. Aff.Off. III	Permanent	employee	53.56	53.56	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	18	137.13	30.00
49	EMP046	joycealonzo@msumain.edu.ph	password123	Joyce Alonzo	Audio Visual Center	ADAS II	Temporary	employee	43.25	43.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	8	354.50	268.00
50	EMP047	marvinevangelista@msumain.edu.ph	password123	Marvin Evangelista	Audio Visual Center	SADOF	Permanent	employee	62.88	62.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	22	145.75	20.00
51	EMP048	donnalucero@msumain.edu.ph	password123	Donna Lucero	Audio Visual Center	ADA VI	Temporary	employee	115.50	115.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	381.00	150.00
52	EMP049	ryanfajardo@msumain.edu.ph	password123	Ryan Fajardo	Audio Visual Center	ADA V	Temporary	employee	73.75	73.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	5	167.50	20.00
2	OVCAA001	ovcaa.admin@msumain.edu.ph	password123	OVCAA Director	OVCAA	Director	Permanent	ovcaa	0.00	0.00	3.00	5.00	2026-02-06 14:09:14.250639	2026-05-23 18:27:45.514328	\N	0	0.00	0.00
53	EMP050	maytorres@msumain.edu.ph	password123	May Torres	Audio Visual Center	ADA I	Temporary	employee	50.00	50.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	1	115.00	15.00
143	EMP140	arielzamudio@msumain.edu.ph	password123	Ariel Zamudio	College of Information and Computing Sciences	Inst III	Probationary	employee	13.75	13.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	14	27.50	30.00
54	EMP051	dennispacheco@msumain.edu.ph	password123	Dennis Pacheco	Audio Visual Center	ADA III	Temporary	employee	93.75	93.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	3	237.50	50.00
55	EMP052	clarissago@msumain.edu.ph	password123	Clarissa Go	Audio Visual Center	ADA III	Temporary	employee	45.00	45.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	3	105.00	15.00
56	EMP053	joelmarquez@msumain.edu.ph	password123	Joel Marquez	Audio Visual Center	ADA VI	Temporary	employee	101.25	101.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	252.50	50.00
57	EMP054	aileenramos@msumain.edu.ph	password123	Aileen Ramos	Audio Visual Center	ADA VI	Temporary	employee	172.00	172.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	399.00	55.00
58	EMP055	gilbertsy@msumain.edu.ph	password123	Gilbert Sy	Audio Visual Center	ADA V	Permanent	employee	218.50	218.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	5	512.00	75.00
59	EMP056	maureenyulo@msumain.edu.ph	password123	Maureen Yulo	Sports Scholarship Dev. Office	Adm.Aide IV	Temporary	employee	103.50	103.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	287.00	80.00
63	EMP060	kristinealviar@msumain.edu.ph	password123	Kristine Alviar	Sports Scholarship Dev. Office	ADA I	Temporary	employee	91.50	91.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	1	211.00	28.00
65	EMP062	phoebetan@msumain.edu.ph	password123	Phoebe Tan	Board of Regents	ADOF IV	Temporary	employee	54.38	54.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	14	123.75	15.00
66	EMP063	noelcastaneda@msumain.edu.ph	password123	Noel Castañeda	Board of Regents	URA II	Permanent	employee	64.75	64.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	15	158.50	29.00
67	EMP064	rowenaicao@msumain.edu.ph	password123	Rowena Icao	Board of Regents	ADA VI	Temporary	employee	171.25	171.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	662.50	320.00
68	EMP065	wilsonlacsamana@msumain.edu.ph	password123	Wilson Lacsamana	Board of Regents	ADA IV	Temporary	employee	67.50	67.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	195.00	60.00
144	EMP141	rodolfocarandang@msumain.edu.ph	password123	Rodolfo Carandan	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	26.50	26.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	18	53.00	55.00
145	EMP142	imeldafermin@msumain.edu.ph	password123	Imelda Fermin	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	14.41	14.41	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	18	28.83	30.00
159	EMP156	erlindaamistad@msumain.edu.ph	password123	Erlinda Amistad	College of Fisheries and Aquatic Sciences	Instructor III	Permanent	employee	44.84	44.84	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	14	89.67	114.00
162	EMP159	ismaelquinto@msumain.edu.ph	password123	Ismael Quinto	College of Fisheries and Aquatic Sciences	Assoc Prof. V	Permanent	employee	9.06	9.06	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	23	18.13	30.00
166	EMP163	franciscoilagan@msumain.edu.ph	password123	Francisco Ilagan	College of Fisheries and Aquatic Sciences	Assoc Prof. V	Permanent	employee	50.79	50.79	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	23	101.58	100.00
170	EMP167	gregoriopilapil@msumain.edu.ph	password123	Gregorio Pilapil	College of Fisheries and Aquatic Sciences	Assoc Prof. V	Permanent	employee	10.00	10.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	23	20.00	15.00
168	EMP165	andreslimos@msumain.edu.ph	password123	Andres Limos	College of Fisheries and Aquatic Sciences	Assoc Prof. IV	Permanent	employee	85.56	86.56	3.00	5.00	2026-02-06 14:12:29.399468	2026-07-13 21:00:21.301107	teaching	18	173.11	6.00
32	EMP029	alfredyabut@msumain.edu.ph	password123	Alfred Yabut	Human Resource Development Office	ADA VI	Permanent	employee	263.50	263.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	657.00	130.00
33	EMP030	biancaluna@msumain.edu.ph	password123	Bianca Luna	Human Resource Development Office	ADOF V	Permanent	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	18	64.75	76.25
34	EMP031	raymonddelossantos@msumain.edu.ph	password123	Raymond Delos Santos	Human Resource Development Office	ADAS II	Permanent	employee	29.25	29.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	8	93.50	35.00
35	EMP032	camilleabad@msumain.edu.ph	password123	Camille Abad	Human Resource Development Office	ADAS II	Temporary	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	8	77.38	96.25
36	EMP033	oliverpena@msumain.edu.ph	password123	Oliver Peña	Human Resource Development Office	Training Asst.	Permanent	employee	206.00	206.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	8	490.00	78.00
37	EMP034	sherylmanalo@msumain.edu.ph	password123	Sheryl Manalo	Human Resource Development Office	ADOF II	Permanent	employee	207.50	207.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	11	547.00	132.00
3	OVCAF001	ovcaf.admin@msumain.edu.ph	password123	OVCAF Director	OVCAF	Director	Permanent	ovcaf	0.00	0.00	3.00	5.00	2026-02-06 14:09:14.250639	2026-05-23 18:27:45.514328	\N	0	0.00	0.00
78	EMP075	federicoabella@msumain.edu.ph	password123	Federico Abella	Board of Regents	ADA IV	Temporary	employee	20.00	20.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	50.00	10.00
79	EMP076	joansevilla@msumain.edu.ph	password123	Joan Sevilla	Board of Regents	EXA II	Temporary	employee	38.00	38.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	17	134.00	58.00
80	EMP077	arnoldtejada@msumain.edu.ph	password123	Arnold Tejada	Board of Regents	ADOF I	Temporary	employee	101.25	101.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	10	245.50	43.00
106	EMP103	mariofernandez@msumain.edu.ph	password123	Mario Fernandez	College of Agriculture	Assoc Prof. V	Permanent	employee	0.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-24 12:43:54.882657	teaching	23	2.50	31.00
4	EMP001	johnherosapio@msumain.edu.ph	password123	John Hero Sapio	Human Resource Development Office	ADOF III	Permanent	employee	80.88	82.88	3.00	5.00	2026-02-06 14:09:14.250639	2026-06-19 13:06:21.582745	non-teaching	14	565.75	400.00
105	EMP102	ceciliacruz@msumain.edu.ph	password123	Cecilia Cruz	College of Agriculture	Assoc. Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	23	2.50	15.00
108	EMP105	robertochavez@msumain.edu.ph	password123	Roberto Chavez	College of Agriculture	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
109	EMP106	lindamercado@msumain.edu.ph	password123	Linda Mercado	College of Agriculture	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
125	EMP122	nenabautista@msumain.edu.ph	password123	Nena Bautista	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
126	EMP123	carlodominguez@msumain.edu.ph	password123	Carlo Dominguez	College of Information and Computing Sciences	Instructor III	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	2.50	0.00
133	EMP130	pilarestrella@msumain.edu.ph	password123	Pilar Estrella	College of Information and Computing Sciences	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	23	2.50	0.00
134	EMP131	rolandoespino@msumain.edu.ph	password123	Rolando Espino	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
135	EMP132	marilynponce@msumain.edu.ph	password123	Marilyn Ponce	College of Information and Computing Sciences	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	23	2.50	0.00
138	EMP135	vicentealonzo@msumain.edu.ph	password123	Vicente Alonzo	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	32.50	32.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	65.00	0.00
139	EMP136	liliaduran@msumain.edu.ph	password123	Lilia Duran	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
147	EMP144	josephinebaltazar@msumain.edu.ph	password123	Josephine Baltazar	College of Law	Professor VI	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	29	2.50	0.00
173	EMP170	viviansilvestre@msumain.edu.ph	password123	Vivian Silvestre	CHS	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
115	EMP112	maritesvillamor@msumain.edu.ph	password123	Marites Villamor	College of Business Administration and Accountancy	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
123	EMP120	susanortega@msumain.edu.ph	password123	Susan Ortega	College of Business Administration and Accountancy	Assoc Prof. IV	Permanent	employee	10.00	10.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	22	20.00	0.00
47	EMP044	rheapadilla@msumain.edu.ph	password123	Rhea Padilla	Cultural Affairs Office	Musician	Permanent	employee	121.25	121.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	5	317.50	75.00
48	EMP045	allanvergara@msumain.edu.ph	password123	Allan Vergara	Audio Visual Center	ADA IV	Temporary	employee	71.88	71.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	173.75	30.00
5	EMP002	mariasantos@msumain.edu.ph	password123	Maria Santos	Human Resource Development Office	ADA III	Temporary	employee	41.88	41.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	3	108.75	25.00
1	HR001	hr.admin@msumain.edu.ph	password123	HR Administrator	Human Resource Development Office	HR Manager	Permanent	hr	0.00	0.00	3.00	5.00	2026-02-06 14:09:14.250639	2026-05-23 18:27:45.514328	\N	0	0.00	0.00
93	EMP090	teresabonifacio@msumain.edu.ph	password123	Teresa Bonifacio	Campus Budget Office	ADAS I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	7	\N	0.00
94	EMP091	edgarlapuz@msumain.edu.ph	password123	Edgar Lapuz	Administrative Aide Staff	ADAS III	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
95	EMP092	jessamalabanan@msumain.edu.ph	password123	Jessa Malabanan	Accounting Division Office	ADOF I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
96	EMP093	rolandoesguerra@msumain.edu.ph	password123	Rolando Esguerra	Administrative Aide Staff	ADAS I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
97	EMP094	ivycalderon@msumain.edu.ph	password123	Ivy Calderon	Administrative Aide Staff	ADAS II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
98	EMP095	benjamintuazon@msumain.edu.ph	password123	Benjamin Tuazon	Administrative Aide Staff	ADAS II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
99	EMP096	lorieagustin@msumain.edu.ph	password123	Lorie Agustin	Campus Budget Office	Security Guard II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
100	EMP097	noelsoriano@msumain.edu.ph	password123	Noel Soriano	Accounting Division Office	ADOF I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
101	EMP098	hazelmacaraeg@msumain.edu.ph	password123	Hazel Macaraeg	Administrative Aide Staff	ADAS II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
102	EMP099	victorneri@msumain.edu.ph	password123	Victor Neri	Administrative Aide Staff	ADAS I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
103	EMP100	felicityramos@msumain.edu.ph	password123	Felicity Ramos	Administrative Aide Staff	ADAS I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	0	\N	0.00
104	EMP101	albertoramos@msumain.edu.ph	password123	Alberto Ramos	College of Agriculture	Instructor III	Probationary	employee	233.00	233.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	466.00	0.00
111	EMP108	teresaflores@msumain.edu.ph	password123	Teresa Flores	College of Agriculture	Assoc Prof. V	Permanent	employee	15.00	15.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	23	30.00	0.00
113	EMP110	vilmasantos@msumain.edu.ph	password123	Vilma Santos	College of Agriculture	Professor VI	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	29	2.50	0.00
120	EMP117	rogercastillo@msumain.edu.ph	password123	Roger Castillo	College of Business Administration and Accountancy	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	23	2.50	0.00
121	EMP118	lornareyes@msumain.edu.ph	password123	Lorna Reyes	College of Business Administration and Accountancy	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	23	2.50	0.00
124	EMP121	wilfredodiaz@msumain.edu.ph	password123	Wilfredo Diaz	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
128	EMP125	ricoalvarado@msumain.edu.ph	password123	Rico Alvarado	College of Information and Computing Sciences	Professor V	Permanent	employee	7.50	7.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	28	15.00	0.00
129	EMP126	daisysalonga@msumain.edu.ph	password123	Daisy Salonga	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
130	EMP127	hectordeguzman@msumain.edu.ph	password123	Hector De Guzman	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
131	EMP128	mercytolosa@msumain.edu.ph	password123	Mercy Tolosa	College of Information and Computing Sciences	Inst III	Probationary	employee	13.75	13.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	27.50	0.00
132	EMP129	sonnysrivera@msumain.edu.ph	password123	Sonny Rivera	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
136	EMP133	eduardogallo@msumain.edu.ph	password123	Eduardo Gallo	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
137	EMP134	coralegaspi@msumain.edu.ph	password123	Cora Legaspi	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
107	EMP104	evelyngarcia@msumain.edu.ph	password123	Evelyn Garcia	College of Agriculture	Professor VI	Permanent	employee	176.25	176.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	29	352.50	30.00
110	EMP107	nelsonbautista@msumain.edu.ph	password123	Nelson Bautista	College of Agriculture	Assoc Prof. V	Permanent	employee	189.34	189.34	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	23	378.67	15.00
114	EMP111	dennisherrera@msumain.edu.ph	password123	Dennis Herrera	College of Business Administration and Accountancy	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
116	EMP113	joelnavarro@msumain.edu.ph	password123	Joel Navarro	College of Business Administration and Accountancy	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
117	EMP114	femendoza@msumain.edu.ph	password123	Fe Mendoza	College of Business Administration and Accountancy	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
160	EMP157	danilocapistrano@msumain.edu.ph	password123	Danilo Capistrano	College of Fisheries and Aquatic Sciences	Instructor III	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
10	EMP007	paoloreyes@msumain.edu.ph	password123	Paolo Reyes	Human Resource Development Office	T.S.1	Temporary	employee	50.50	50.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	11	207.50	106.50
11	EMP008	lizabautista@msumain.edu.ph	password123	Liza Bautista	Human Resource Development Office	EXA III	Temporary	employee	20.75	20.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	20	44.50	3.00
12	EMP009	danielnavarro@msumain.edu.ph	password123	Daniel Navarro	Human Resource Development Office	Administrative Officer IV	Temporary	employee	406.25	406.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	15	997.50	185.00
13	EMP010	gracepanganiban@msumain.edu.ph	password123	Grace Panganiban	Human Resource Development Office	ADA I	Permanent	employee	89.38	89.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	1	228.75	50.00
14	EMP011	michaelflores@msumain.edu.ph	password123	Michael Flores	Human Resource Development Office	Administrative Aide IV	Temporary	employee	3.38	3.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	15.75	9.00
15	EMP012	katrinacruz@msumain.edu.ph	password123	Katrina Cruz	Human Resource Development Office	Adm. Aide III	Temporary	employee	29.75	29.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	3	104.50	45.00
16	EMP013	ronaldaquino@msumain.edu.ph	password123	Ronald Aquino	Human Resource Development Office	SADOF	Permanent	employee	27.88	27.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	22	152.00	96.25
161	EMP158	rosalindamaturan@msumain.edu.ph	password123	Rosalinda Maturan	College of Fisheries and Aquatic Sciences	Professor VI	Permanent	employee	39.09	39.09	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	teaching	29	78.17	77.00
17	EMP014	jasmineortega@msumain.edu.ph	password123	Jasmine Ortega	Human Resource Development Office	ADOF IV	Temporary	employee	113.25	116.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-07-11 20:28:55.587331	non-teaching	15	292.50	68.00
18	EMP015	vincentlim@msumain.edu.ph	password123	Vincent Lim	Human Resource Development Office	ADOF V	Temporary	employee	56.25	56.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	18	225.00	112.50
19	EMP016	sheilagonzales@msumain.edu.ph	password123	Sheila Gonzales	Human Resource Development Office	ADA III	Permanent	employee	15.00	15.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	3	40.00	10.00
20	EMP017	andrewcastillo@msumain.edu.ph	password123	Andrew Castillo	Human Resource Development Office	ADA IV	Permanent	employee	140.88	140.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	366.75	85.00
21	EMP018	ninamercado@msumain.edu.ph	password123	Nina Mercado	Human Resource Development Office	CAO	Permanent	employee	38.38	38.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	24	91.75	15.00
22	EMP019	briantan@msumain.edu.ph	password123	Brian Tan	Human Resource Development Office	ADA VI	Temporary	employee	169.00	169.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	413.00	75.00
23	EMP020	rosevaldez@msumain.edu.ph	password123	Rose Valdez	Human Resource Development Office	ADA VI	Temporary	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	115.50	163.38
24	EMP021	patrickdizon@msumain.edu.ph	password123	Patrick Dizon	Human Resource Development Office	ADA VI	Temporary	employee	86.25	86.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	202.50	30.00
25	EMP022	cherryespiritu@msumain.edu.ph	password123	Cherry Espiritu	Human Resource Development Office	ADA IV	Temporary	employee	26.56	26.56	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	96.25	43.13
26	EMP023	kevinocampo@msumain.edu.ph	password123	Kevin Ocampo	Human Resource Development Office	Adm. Off, II	Temporary	employee	155.00	155.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	11	620.25	310.25
27	EMP024	faithsalazar@msumain.edu.ph	password123	Faith Salazar	Human Resource Development Office	ADA IV	Permanent	employee	237.75	237.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	611.50	136.00
28	EMP025	jeromepascual@msumain.edu.ph	password123	Jerome Pascual	Human Resource Development Office	ADA IV	Permanent	employee	70.88	70.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	276.75	135.00
29	EMP026	angelicafuentes@msumain.edu.ph	password123	Angelica Fuentes	Human Resource Development Office	ADOF V	Permanent	employee	97.75	97.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	18	315.50	120.00
30	EMP027	noelmacapagal@msumain.edu.ph	password123	Noel Macapagal	Human Resource Development Office	ADA IV	Temporary	employee	45.25	45.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	303.00	212.50
89	EMP086	rizzacamacho@msumain.edu.ph	password123	Rizza Camacho	Board of Regents	URA II	Temporary	employee	39.97	39.97	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	15	349.81	269.88
90	EMP087	antoniosison@msumain.edu.ph	password123	Antonio Sison	Board of Regents	ADA IV	Temporary	employee	53.75	53.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	122.50	15.00
91	EMP088	maribelcarpio@msumain.edu.ph	password123	Maribel Carpio	Board of Regents	Board Sec. V	Permanent	employee	271.00	271.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	25	624.00	82.00
92	EMP089	albertrosales@msumain.edu.ph	password123	Albert Rosales	Board of Regents	University Secretary I	Temporary	employee	14.38	14.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	28	41.75	13.00
31	EMP028	erikasoriano@msumain.edu.ph	password123	Erika Soriano	Human Resource Development Office	ADA IV	Permanent	employee	122.79	122.79	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	495.58	250.00
40	EMP037	edwinroxas@msumain.edu.ph	password123	Edwin Roxas	Cultural Affairs Office	ADAS III	Temporary	employee	114.12	114.12	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	10	270.25	42.00
38	EMP035	jonathanuy@msumain.edu.ph	password123	Jonathan Uy	Cultural Affairs Office	Musician	Temporary	employee	26.00	26.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	5	52.00	0.00
39	EMP036	triciamolina@msumain.edu.ph	password123	Tricia Molina	Cultural Affairs Office	ADA III	Temporary	employee	12.50	12.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	3	25.00	0.00
60	EMP057	robertopalma@msumain.edu.ph	password123	Roberto Palma	Sports Scholarship Dev. Office	Trng.Spcl. II	Temporary	employee	246.25	246.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	15	492.50	0.00
61	EMP058	janineuy@msumain.edu.ph	password123	Janine Uy	Sports Scholarship Dev. Office	ADA I	Temporary	employee	30.00	30.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	1	60.00	0.00
62	EMP059	oscardevera@msumain.edu.ph	password123	Oscar De Vera	Sports Scholarship Dev. Office	Trng.Spcl. III	Temporary	employee	30.00	30.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	18	60.00	0.00
64	EMP061	allandomingo@msumain.edu.ph	password123	Allan Domingo	Sports Scholarship Dev. Office	ADOF I	Temporary	employee	195.00	195.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	10	390.00	0.00
41	EMP038	hannahcorpuz@msumain.edu.ph	password123	Hannah Corpuz	Cultural Affairs Office	Musician	Temporary	employee	106.50	106.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	5	248.00	35.00
42	EMP039	leocordero@msumain.edu.ph	password123	Leo Cordero	Cultural Affairs Office	Adm.Aide VI	Temporary	employee	98.19	98.19	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	241.38	45.00
43	EMP040	melissaibarra@msumain.edu.ph	password123	Melissa Ibarra	Cultural Affairs Office	CAO II	Temporary	employee	168.50	168.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	15	519.00	182.00
44	EMP041	francistolentino@msumain.edu.ph	password123	Francis Tolentino	Cultural Affairs Office	ADOF IV	Temporary	employee	56.25	56.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	15	142.50	30.00
45	EMP042	irenecaballero@msumain.edu.ph	password123	Irene Caballero	Cultural Affairs Office	Media Production Spe	Temporary	employee	179.25	179.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	11	578.50	220.00
69	EMP066	dianamontoya@msumain.edu.ph	password123	Diana Montoya	Board of Regents	ADA IV	Temporary	employee	31.12	31.12	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	72.25	10.00
70	EMP067	arturobeltran@msumain.edu.ph	password123	Arturo Beltran	Board of Regents	Uni. Researcher II	Temporary	employee	10.25	10.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	15	304.88	284.38
71	EMP068	sallycordero@msumain.edu.ph	password123	Sally Cordero	Board of Regents	ADA IV	Temporary	employee	102.42	102.42	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	243.83	39.00
72	EMP069	renedelmundo@msumain.edu.ph	password123	Rene Del Mundo	Board of Regents	ADOF III	Temporary	employee	34.12	34.12	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	12	78.25	10.00
73	EMP070	aprilrobles@msumain.edu.ph	password123	April Robles	Board of Regents	ADA IV	Temporary	employee	34.25	34.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	73.50	5.00
74	EMP071	samuelalcantara@msumain.edu.ph	password123	Samuel Alcantara	Board of Regents	ADA VI	Temporary	employee	42.41	42.41	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	136.82	52.00
75	EMP072	myrafuentebella@msumain.edu.ph	password123	Myra Fuentebella	Board of Regents	Sr. ADAS III	Temporary	employee	107.83	107.83	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	15	251.67	36.00
76	EMP073	lesterpineda@msumain.edu.ph	password123	Lester Pineda	Board of Regents	ADOF II	Temporary	employee	137.00	137.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	12	390.00	116.00
77	EMP074	joycemadarang@msumain.edu.ph	password123	Joyce Madarang	Board of Regents	Bor. Sec. IV	Temporary	employee	96.00	96.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	22	238.00	46.00
81	EMP078	emelyngatchalian@msumain.edu.ph	password123	Emelyn Gatchalian	Board of Regents	ADA IV	Temporary	employee	35.50	35.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	4	83.00	12.00
82	EMP079	paoloinigo@msumain.edu.ph	password123	Paolo Iñigo	Board of Regents	ADA VI	Temporary	employee	70.00	70.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	206.00	66.00
84	EMP081	reynaldomagsaysay@msumain.edu.ph	password123	Reynaldo Magsaysay	Board of Regents	ADA VI	Temporary	employee	75.00	75.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	6	193.00	43.00
85	EMP082	patriciazamora@msumain.edu.ph	password123	Patricia Zamora	Board of Regents	PDO I	Temporary	employee	87.62	87.62	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	11	223.25	48.00
86	EMP083	leoamador@msumain.edu.ph	password123	Leo Amador	Board of Regents	EXA I	Temporary	employee	151.25	151.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	14	434.50	132.00
87	EMP084	cynthialaurel@msumain.edu.ph	password123	Cynthia Laurel	Board of Regents	EXA II	Temporary	employee	103.00	103.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	17	251.00	45.00
88	EMP085	manuelquiambao@msumain.edu.ph	password123	Manuel Quiambao	Board of Regents	ADA III	Permanent	employee	274.75	274.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-06-19 13:06:21.582745	non-teaching	3	624.50	75.00
83	EMP080	veronicanolasco@msumain.edu.ph	password123	Veronica Nolasco	Board of Regents	ADA II	Temporary	employee	15.00	15.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	non-teaching	2	30.00	0.00
140	EMP137	manuelibanez@msumain.edu.ph	password123	Manuel Ibanez	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
141	EMP138	rowellsarmiento@msumain.edu.ph	password123	Rowell Sarmiento	College of Information and Computing Sciences	Inst III	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	2.50	0.00
142	EMP139	nildamontano@msumain.edu.ph	password123	Nilda Montano	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
146	EMP143	renatobelen@msumain.edu.ph	password123	Renato Belen	College of Law	Assoc Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	22	2.50	0.00
148	EMP145	felixumali@msumain.edu.ph	password123	Felix Umali	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
149	EMP146	ofelialanting@msumain.edu.ph	password123	Ofelia Lanting	College of Law	Assoc Prof. II	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	20	2.50	0.00
150	EMP147	leoncioprado@msumain.edu.ph	password123	Leoncio Prado	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
151	EMP148	marjoriebaylon@msumain.edu.ph	password123	Marjorie Baylon	College of Law	Asst. Prof. IV	Probationary	employee	2.21	2.21	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	4.42	0.00
152	EMP149	ernestodelapena@msumain.edu.ph	password123	Ernesto Dela Peña	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
153	EMP150	leticiafajardo@msumain.edu.ph	password123	Leticia Fajardo	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
154	EMP151	romeoarce@msumain.edu.ph	password123	Romeo Arce	College of Law	Assoc Prof. V	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	23	2.50	0.00
155	EMP152	yolandabelmonte@msumain.edu.ph	password123	Yolanda Belmonte	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
156	EMP153	florenciocasimiro@msumain.edu.ph	password123	Florencio Casimiro	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
157	EMP154	anitallagas@msumain.edu.ph	password123	Anita Llagas	College of Fisheries and Aquatic Sciences	Instructor II	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	13	2.50	0.00
158	EMP155	salvadorcunanan@msumain.edu.ph	password123	Salvador Cunanan	College of Fisheries and Aquatic Sciences	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
163	EMP160	perladacumos@msumain.edu.ph	password123	Perla Dacumos	College of Fisheries and Aquatic Sciences	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
164	EMP161	rubenagpalo@msumain.edu.ph	password123	Ruben Agpalo	College of Fisheries and Aquatic Sciences	Assoc Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	22	2.50	0.00
165	EMP162	teresitagalvez@msumain.edu.ph	password123	Teresita Galvez	College of Fisheries and Aquatic Sciences	Instructor III	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	2.50	0.00
167	EMP164	mylenebarrameda@msumain.edu.ph	password123	Mylene Barrameda	College of Fisheries and Aquatic Sciences	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
169	EMP166	elvirasamson@msumain.edu.ph	password123	Elvira Samson	College of Fisheries and Aquatic Sciences	Asst. Prof. I	Probationary	employee	15.00	15.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	30.00	0.00
171	EMP168	jocelynnatividad@msumain.edu.ph	password123	Jocelyn Natividad	CHS	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	2.50	0.00
172	EMP169	teodorocalayag@msumain.edu.ph	password123	Teodoro Calayag	CHS	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	2.50	0.00
174	EMP171	isidrolagman@msumain.edu.ph	password123	Isidro Lagman	College of Social Sciences and Humanities	Instructor I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	\N	0.00
175	EMP172	concepcionhilario@msumain.edu.ph	password123	Concepcion Hilario	College of Social Sciences and Humanities	Instructor I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	\N	0.00
176	EMP173	napoleonarellano@msumain.edu.ph	password123	Napoleon Arellano	College of Social Sciences and Humanities	Instructor II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	13	\N	0.00
177	EMP174	estrellatadeo@msumain.edu.ph	password123	Estrella Tadeo	College of Social Sciences and Humanities	Instructor II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	13	\N	0.00
178	EMP175	bonifaciohermosa@msumain.edu.ph	password123	Bonifacio Hermosa	College of Social Sciences and Humanities	Instructor I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	\N	0.00
179	EMP176	divinabatoon@msumain.edu.ph	password123	Divina Batoon	College of Social Sciences and Humanities	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
180	EMP177	leopoldoandaya@msumain.edu.ph	password123	Leopoldo Andaya	College of Social Sciences and Humanities	Instructor III	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	\N	0.00
181	EMP178	carmelitamorente@msumain.edu.ph	password123	Carmelita Morente	College of Social Sciences and Humanities	Instructor III	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	\N	0.00
182	EMP179	severinopalmes@msumain.edu.ph	password123	Severino Palmes	College of Social Sciences and Humanities	Instructor I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	\N	0.00
183	EMP180	natividadlobo@msumain.edu.ph	password123	Natividad Lobo	College of Social Sciences and Humanities	Instructor III	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	\N	0.00
184	EMP181	prudenciotalusan@msumain.edu.ph	password123	Prudencio Talusan 	College of Social Sciences and Humanities	Instructor II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	13	\N	0.00
185	EMP182	beatrizalmazan@msumain.edu.ph	password123	Beatriz Almazan	College of Social Sciences and Humanities	Instructor III	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	\N	0.00
186	EMP183	cristobalyambao@msumain.edu.ph	password123	Cristobal Yambao	College of Social Sciences and Humanities	Assistant Professor I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	15	\N	0.00
187	EMP184	lolitamabini@msumain.edu.ph	password123	Lolita Mabini	College of Business Administration and Accountancy	Instructor III	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	\N	0.00
188	EMP185	domingovelasco@msumain.edu.ph	password123	Domingo Velasco	College of Business Administration and Accountancy	Instructor II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	13	\N	0.00
189	EMP186	adelarobredo@msumain.edu.ph	password123	Adela Robredo	College of Business Administration and Accountancy	Instructor II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	13	\N	0.00
190	EMP187	hilariogonzaga@msumain.edu.ph	password123	Hilario Gonzaga	College of Business Administration and Accountancy	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
191	EMP188	lourdesmanansala@msumain.edu.ph	password123	Lourdes Manansala	College of Business Administration and Accountancy	Instructor I	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	12	\N	0.00
192	EMP189	pedrotalavera@msumain.edu.ph	password123	Pedro Talavera	College of Business Administration and Accountancy	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
193	EMP190	consolacionbernal@msumain.edu.ph	password123	Consolacion Bernal	College of Business Administration and Accountancy	Instructor III	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	14	\N	0.00
194	EMP191	crispinalvero@msumain.edu.ph	password123	Crispin Alvero	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	17	\N	0.00
195	EMP192	josefinamedrano@msumain.edu.ph	password123	Josefina Medrano	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
196	EMP193	baltazarrollan@msumain.edu.ph	password123	Baltazar Roldan	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
197	EMP194	purificaciondelatorre@msumain.edu.ph	password123	Purificacion Dela Torre	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
198	EMP195	luciopoblador@msumain.edu.ph	password123	Lucio Poblador	College of Natural Sciences and Mathematics	Instructor II	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	13	\N	0.00
199	EMP196	estefaniaquintos@msumain.edu.ph	password123	Estefania Quintos	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
200	EMP197	rogelioarrion@msumain.edu.ph	password123	Rogelio Barrion	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
201	EMP198	magdalenafortes@msumain.edu.ph	password123	Magdalena Fortes	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
202	EMP199	anselmocordova@msumain.edu.ph	password123	Anselmo Cordova	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
203	EMP200	remediosvillar@msumain.edu.ph	password123	Remedios Villar	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	\N	\N	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-23 18:29:51.723448	teaching	18	\N	0.00
\.


--
-- Data for Name: users_backup; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users_backup (id, employee_id, email, password, full_name, department, "position", employment_type, role, vacation_leave_balance, sick_leave_balance, special_privilege_leave_balance, forced_leave_balance, created_at, updated_at, employee_type, salary_grade, total_leave_credits, total_leave_availed) FROM stdin;
38	EMP035	jonathanuy@msumain.edu.ph	password123	Jonathan Uy	Cultural Affairs Office	Musician	Temporary	employee	26.00	26.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	5	52.00	0.00
39	EMP036	triciamolina@msumain.edu.ph	password123	Tricia Molina	Cultural Affairs Office	ADA III	Temporary	employee	12.50	12.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	3	25.00	0.00
40	EMP037	edwinroxas@msumain.edu.ph	password123	Edwin Roxas	Cultural Affairs Office	ADAS III	 Temporary	employee	135.12	135.12	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	10	270.25	42.00
77	EMP074	joycemadarang@msumain.edu.ph	password123	Joyce Madarang	Board of Regents	Bor. Sec. IV	Temporary	employee	119.00	119.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	22	238.00	46.00
6	EMP003	joseramirez@msumain.edu.ph	password123	Jose Ramirez	Human Resource Development Office	ADOF IV	Temporary	employee	110.33	110.33	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	220.67	50.00
7	EMP004	anavillanueva@msumain.edu.ph	password123	Ana Villanueva	Human Resource Development Office	TS I	Temporary	employee	52.38	52.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	11	104.75	19.00
8	EMP005	marklorenzo@msumain.edu.ph	password123	Mark Lorenzo	Human Resource Development Office	ADOF II	Temporary	employee	162.94	162.94	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	11	325.87	162.94
9	EMP006	carlamendoza@msumain.edu.ph	password123	Carla Mendoza	Human Resource Development Office	Training Specialst I	Permanent	employee	40.00	40.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	11	80.00	42.50
10	EMP007	paoloreyes@msumain.edu.ph	password123	Paolo Reyes	Human Resource Development Office	T.S.1	Temporary	employee	103.75	103.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	11	207.50	106.50
11	EMP008	lizabautista@msumain.edu.ph	password123	Liza Bautista	Human Resource Development Office	EXA III	Temporary	employee	22.25	22.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	20	44.50	3.00
12	EMP009	danielnavarro@msumain.edu.ph	password123	Daniel Navarro	Human Resource Development Office	Administrative Officer IV	Temporary	employee	498.75	498.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	997.50	185.00
13	EMP010	gracepanganiban@msumain.edu.ph	password123	Grace Panganiban	Human Resource Development Office	ADA I	Permanent	employee	114.38	114.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	1	228.75	50.00
14	EMP011	michaelflores@msumain.edu.ph	password123	Michael Flores	Human Resource Development Office	Administrative Aide IV	Temporary	employee	7.88	7.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	15.75	9.00
15	EMP012	katrinacruz@msumain.edu.ph	password123	Katrina Cruz	Human Resource Development Office	Adm. Aide III	Temporary	employee	52.25	52.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	3	104.50	45.00
16	EMP013	ronaldaquino@msumain.edu.ph	password123	Ronald Aquino	Human Resource Development Office	SADOF	Permanent	employee	76.00	76.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	22	152.00	96.25
17	EMP014	jasmineortega@msumain.edu.ph	password123	Jasmine Ortega	Human Resource Development Office	ADOF IV	Temporary	employee	146.25	146.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	292.50	60.00
18	EMP015	vincentlim@msumain.edu.ph	password123	Vincent Lim	Human Resource Development Office	ADOF V	Temporary	employee	112.50	112.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	18	225.00	112.50
19	EMP016	sheilagonzales@msumain.edu.ph	password123	Sheila Gonzales	Human Resource Development Office	ADA III	Permanent	employee	20.00	20.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	3	40.00	10.00
20	EMP017	andrewcastillo@msumain.edu.ph	password123	Andrew Castillo	Human Resource Development Office	ADA IV	Permanent	employee	183.38	183.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	366.75	85.00
21	EMP018	ninamercado@msumain.edu.ph	password123	Nina Mercado	Human Resource Development Office	CAO	Permanent	employee	45.88	45.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	24	91.75	15.00
22	EMP019	briantan@msumain.edu.ph	password123	Brian Tan	Human Resource Development Office	ADA VI	Temporary	employee	206.50	206.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	413.00	75.00
23	EMP020	rosevaldez@msumain.edu.ph	password123	Rose Valdez	Human Resource Development Office	ADA VI	Temporary	employee	57.75	57.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	115.50	163.38
24	EMP021	patrickdizon@msumain.edu.ph	password123	Patrick Dizon	Human Resource Development Office	ADA VI	Temporary	employee	101.25	101.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	202.50	30.00
25	EMP022	cherryespiritu@msumain.edu.ph	password123	Cherry Espiritu	Human Resource Development Office	ADA IV	Temporary	employee	48.12	48.12	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	96.25	43.13
26	EMP023	kevinocampo@msumain.edu.ph	password123	Kevin Ocampo	Human Resource Development Office	Adm. Off, II	Temporary	employee	310.12	310.12	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	11	620.25	310.25
27	EMP024	faithsalazar@msumain.edu.ph	password123	Faith Salazar	Human Resource Development Office	ADA IV	Permanent	employee	305.75	305.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	611.50	136.00
28	EMP025	jeromepascual@msumain.edu.ph	password123	Jerome Pascual	Human Resource Development Office	ADA IV	Permanent	employee	138.38	138.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	276.75	135.00
29	EMP026	angelicafuentes@msumain.edu.ph	password123	Angelica Fuentes	Human Resource Development Office	ADOF V	Permanent	employee	157.75	157.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	18	315.50	120.00
30	EMP027	noelmacapagal@msumain.edu.ph	password123	Noel Macapagal	Human Resource Development Office	ADA IV	Temporary	employee	151.50	151.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	303.00	212.50
31	EMP028	erikasoriano@msumain.edu.ph	password123	Erika Soriano	Human Resource Development Office	ADA IV	Permanent	employee	247.79	247.79	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	495.58	250.00
2	OVCAA001	ovcaa.admin@msumain.edu.ph	password123	OVCAA Director	OVCAA	Director	Permanent	ovcaa	0.00	0.00	3.00	5.00	2026-02-06 14:09:14.250639	2026-05-15 14:07:58.473809	\N	0	0.00	0.00
3	OVCAF001	ovcaf.admin@msumain.edu.ph	password123	OVCAF Director	OVCAF	Director	Permanent	ovcaf	0.00	0.00	3.00	5.00	2026-02-06 14:09:14.250639	2026-05-15 14:07:58.473809	\N	0	0.00	0.00
78	EMP075	federicoabella@msumain.edu.ph	password123	Federico Abella	Board of Regents	ADA IV	Temporary	employee	25.00	25.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	50.00	10.00
79	EMP076	joansevilla@msumain.edu.ph	password123	Joan Sevilla	Board of Regents	EXA II	Temporary	employee	67.00	67.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	17	134.00	58.00
80	EMP077	arnoldtejada@msumain.edu.ph	password123	Arnold Tejada	Board of Regents	ADOF I	Temporary	employee	122.75	122.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	10	245.50	43.00
81	EMP078	emelyngatchalian@msumain.edu.ph	password123	Emelyn Gatchalian	Board of Regents	ADA IV	Temporary	employee	41.50	41.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	83.00	12.00
82	EMP079	paoloinigo@msumain.edu.ph	password123	Paolo Iñigo	Board of Regents	ADA VI	Temporary	employee	103.00	103.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	206.00	66.00
83	EMP080	veronicanolasco@msumain.edu.ph	password123	Veronica Nolasco	Board of Regents	ADA II	Temporary	employee	15.00	15.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	2	30.00	0.00
84	EMP081	reynaldomagsaysay@msumain.edu.ph	password123	Reynaldo Magsaysay	Board of Regents	ADA VI	Temporary	employee	96.50	96.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	193.00	43.00
85	EMP082	patriciazamora@msumain.edu.ph	password123	Patricia Zamora	Board of Regents	PDO I	Temporary	employee	111.62	111.62	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	11	223.25	48.00
86	EMP083	leoamador@msumain.edu.ph	password123	Leo Amador	Board of Regents	EXA I	Temporary	employee	217.25	217.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	14	434.50	132.00
87	EMP084	cynthialaurel@msumain.edu.ph	password123	Cynthia Laurel	Board of Regents	EXA II	Temporary	employee	125.50	125.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	17	251.00	45.00
88	EMP085	manuelquiambao@msumain.edu.ph	password123	Manuel Quiambao	Board of Regents	ADA III	Permanent	employee	312.25	312.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	3	624.50	75.00
32	EMP029	alfredyabut@msumain.edu.ph	password123	Alfred Yabut	Human Resource Development Office	ADA VI	Permanent	employee	328.50	328.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	657.00	130.00
33	EMP030	biancaluna@msumain.edu.ph	password123	Bianca Luna	Human Resource Development Office	ADOF V	Permanent	employee	32.38	32.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	18	64.75	76.25
34	EMP031	raymonddelossantos@msumain.edu.ph	password123	Raymond Delos Santos	Human Resource Development Office	ADAS II	Permanent	employee	46.75	46.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	8	93.50	35.00
35	EMP032	camilleabad@msumain.edu.ph	password123	Camille Abad	Human Resource Development Office	ADAS II	Temporary	employee	38.69	38.69	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	8	77.38	96.25
36	EMP033	oliverpena@msumain.edu.ph	password123	Oliver Peña	Human Resource Development Office	Training Asst.	Permanent	employee	245.00	245.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	8	490.00	78.00
37	EMP034	sherylmanalo@msumain.edu.ph	password123	Sheryl Manalo	Human Resource Development Office	ADOF II	 Permanent	employee	273.50	273.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	11	547.00	132.00
124	EMP121	wilfredodiaz@msumain.edu.ph	password123	Wilfredo Diaz	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
127	EMP124	almavalerio@msumain.edu.ph	password123	Alma Valerio	College of Information and Computing Sciences	Assoc Prof. V	Permanent	employee	64.08	64.08	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	128.17	105.00
128	EMP125	ricoalvarado@msumain.edu.ph	password123	Rico Alvarado	College of Information and Computing Sciences	Professor V	Permanent	employee	7.50	7.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	28	15.00	0.00
129	EMP126	daisysalonga@msumain.edu.ph	password123	Daisy Salonga	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
130	EMP127	hectordeguzman@msumain.edu.ph	password123	Hector De Guzman	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
131	EMP128	mercytolosa@msumain.edu.ph	password123	Mercy Tolosa	College of Information and Computing Sciences	Inst III	Probationary	employee	13.75	13.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	27.50	0.00
4	EMP001	johnherosapio@msumain.edu.ph	password123	John Hero Sapio	Human Resource Development Office	ADOF III	Permanent	employee	282.88	282.88	3.00	5.00	2026-02-06 14:09:14.250639	2026-05-15 14:08:10.907622	non-teaching	0	565.76	0.00
104	EMP101	albertoramos@msumain.edu.ph	password123	Alberto Ramos	College of Agriculture	Instructor III	Probationary	employee	233.00	233.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:08:10.907622	teaching	0	466.00	0.00
171	EMP168	jocelynnatividad@msumain.edu.ph	password123	Jocelyn Natividad	CHS	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
172	EMP169	teodorocalayag@msumain.edu.ph	password123	Teodoro Calayag	CHS	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
173	EMP170	viviansilvestre@msumain.edu.ph	password123	Vivian Silvestre	CHS	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
132	EMP129	sonnysrivera@msumain.edu.ph	password123	Sonny Rivera	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
133	EMP130	pilarestrella@msumain.edu.ph	password123	Pilar Estrella	College of Information and Computing Sciences	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	2.50	0.00
134	EMP131	rolandoespino@msumain.edu.ph	password123	Rolando Espino	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
135	EMP132	marilynponce@msumain.edu.ph	password123	Marilyn Ponce	College of Information and Computing Sciences	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	2.50	0.00
136	EMP133	eduardogallo@msumain.edu.ph	password123	Eduardo Gallo	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
137	EMP134	coralegaspi@msumain.edu.ph	password123	Cora Legaspi	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
138	EMP135	vicentealonzo@msumain.edu.ph	password123	Vicente Alonzo	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	32.50	32.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	65.00	0.00
139	EMP136	liliaduran@msumain.edu.ph	password123	Lilia Duran	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
140	EMP137	manuelibanez@msumain.edu.ph	password123	Manuel Ibanez	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
141	EMP138	rowellsarmiento@msumain.edu.ph	password123	Rowell Sarmiento	College of Information and Computing Sciences	Inst III	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	2.50	0.00
142	EMP139	nildamontano@msumain.edu.ph	password123	Nilda Montano	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
143	EMP140	arielzamudio@msumain.edu.ph	password123	Ariel Zamudio	College of Information and Computing Sciences	Inst III	Probationary	employee	13.75	13.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	27.50	30.00
144	EMP141	rodolfocarandang@msumain.edu.ph	password123	Rodolfo Carandan	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	26.50	26.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	53.00	55.00
145	EMP142	imeldafermin@msumain.edu.ph	password123	Imelda Fermin	College of Information and Computing Sciences	Asst. Prof. IV	Permanent	employee	14.41	14.41	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	28.83	30.00
146	EMP143	renatobelen@msumain.edu.ph	password123	Renato Belen	College of Law	Assoc Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	22	2.50	0.00
147	EMP144	josephinebaltazar@msumain.edu.ph	password123	Josephine Baltazar	College of Law	Professor VI	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	29	2.50	0.00
148	EMP145	felixumali@msumain.edu.ph	password123	Felix Umali	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
149	EMP146	ofelialanting@msumain.edu.ph	password123	Ofelia Lanting	College of Law	Assoc Prof. II	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	20	2.50	0.00
150	EMP147	leoncioprado@msumain.edu.ph	password123	Leoncio Prado	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
151	EMP148	marjoriebaylon@msumain.edu.ph	password123	Marjorie Baylon	College of Law	Asst. Prof. IV	Probationary	employee	2.21	2.21	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	4.42	0.00
152	EMP149	ernestodelapena@msumain.edu.ph	password123	Ernesto Dela Peña	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
153	EMP150	leticiafajardo@msumain.edu.ph	password123	Leticia Fajardo	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
154	EMP151	romeoarce@msumain.edu.ph	password123	Romeo Arce	College of Law	Assoc Prof. V	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	2.50	0.00
155	EMP152	yolandabelmonte@msumain.edu.ph	password123	Yolanda Belmonte	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
156	EMP153	florenciocasimiro@msumain.edu.ph	password123	Florencio Casimiro	College of Law	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
157	EMP154	anitallagas@msumain.edu.ph	password123	Anita Llagas	College of Fisheries and Aquatic Sciences	Instructor II	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	13	2.50	0.00
158	EMP155	salvadorcunanan@msumain.edu.ph	password123	Salvador Cunanan	College of Fisheries and Aquatic Sciences	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
159	EMP156	erlindaamistad@msumain.edu.ph	password123	Erlinda Amistad	College of Fisheries and Aquatic Sciences	Instructor III	Permanent	employee	44.84	44.84	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	89.67	114.00
105	EMP102	ceciliacruz@msumain.edu.ph	password123	Cecilia Cruz	College of Agriculture	Assoc. Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	2.50	15.00
106	EMP103	mariofernandez@msumain.edu.ph	password123	Mario Fernandez	College of Agriculture	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	2.50	30.00
107	EMP104	evelyngarcia@msumain.edu.ph	password123	Evelyn Garcia	College of Agriculture	Professor VI	Permanent	employee	176.25	176.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	29	352.50	30.00
108	EMP105	robertochavez@msumain.edu.ph	password123	Roberto Chavez	College of Agriculture	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
109	EMP106	lindamercado@msumain.edu.ph	password123	Linda Mercado	College of Agriculture	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
110	EMP107	nelsonbautista@msumain.edu.ph	password123	Nelson Bautista	College of Agriculture	Assoc Prof. V	Permanent	employee	189.34	189.34	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	378.67	15.00
111	EMP108	teresaflores@msumain.edu.ph	password123	Teresa Flores	College of Agriculture	Assoc Prof. V	Permanent	employee	15.00	15.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	30.00	0.00
112	EMP109	arnoldpineda@msumain.edu.ph	password123	Arnold Pineda	College of Agriculture	Asst. Prof. IV	Permanent	employee	32.50	32.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	65.00	30.00
113	EMP110	vilmasantos@msumain.edu.ph	password123	Vilma Santos	College of Agriculture	Professor VI	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	29	2.50	0.00
125	EMP122	nenabautista@msumain.edu.ph	password123	Nena Bautista	College of Information and Computing Sciences	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
126	EMP123	carlodominguez@msumain.edu.ph	password123	Carlo Dominguez	College of Information and Computing Sciences	Instructor III	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	2.50	0.00
184	EMP181	prudenciotalusan@msumain.edu.ph	password123	Prudencio Talusan 	College of Social Sciences and Humanities	Instructor II	Contractual	employee	7.50	7.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:08:10.907622	teaching	13	15.00	0.00
5	EMP002	mariasantos@msumain.edu.ph	password123	Maria Santos	Human Resource Development Office	ADA III	Temporary	employee	54.38	54.38	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	3	108.75	25.00
1	HR001	hr.admin@msumain.edu.ph	password123	HR Administrator	Human Resource Development Office	HR Manager	Permanent	hr	0.00	0.00	3.00	5.00	2026-02-06 14:09:14.250639	2026-05-15 14:07:58.473809	\N	0	0.00	0.00
160	EMP157	danilocapistrano@msumain.edu.ph	password123	Danilo Capistrano	College of Fisheries and Aquatic Sciences	Instructor III	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
161	EMP158	rosalindamaturan@msumain.edu.ph	password123	Rosalinda Maturan	College of Fisheries and Aquatic Sciences	Professor VI	Permanent	employee	39.09	39.09	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	29	78.17	77.00
162	EMP159	ismaelquinto@msumain.edu.ph	password123	Ismael Quinto	College of Fisheries and Aquatic Sciences	Assoc Prof. V	Permanent	employee	9.06	9.06	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	18.13	30.00
163	EMP160	perladacumos@msumain.edu.ph	password123	Perla Dacumos	College of Fisheries and Aquatic Sciences	Asst. Prof. IV	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
164	EMP161	rubenagpalo@msumain.edu.ph	password123	Ruben Agpalo	College of Fisheries and Aquatic Sciences	Assoc Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	22	2.50	0.00
165	EMP162	teresitagalvez@msumain.edu.ph	password123	Teresita Galvez	College of Fisheries and Aquatic Sciences	Instructor III	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	2.50	0.00
166	EMP163	franciscoilagan@msumain.edu.ph	password123	Francisco Ilagan	College of Fisheries and Aquatic Sciences	Assoc Prof. V	Permanent	employee	50.79	50.79	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	101.58	100.00
167	EMP164	mylenebarrameda@msumain.edu.ph	password123	Mylene Barrameda	College of Fisheries and Aquatic Sciences	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
168	EMP165	andreslimos@msumain.edu.ph	password123	Andres Limos	College of Fisheries and Aquatic Sciences	Assoc Prof. IV	Permanent	employee	86.56	86.56	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	173.11	5.00
169	EMP166	elvirasamson@msumain.edu.ph	password123	Elvira Samson	College of Fisheries and Aquatic Sciences	Asst. Prof. I	Probationary	employee	15.00	15.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	30.00	0.00
170	EMP167	gregoriopilapil@msumain.edu.ph	password123	Gregorio Pilapil	College of Fisheries and Aquatic Sciences	Assoc Prof. V	Permanent	employee	10.00	10.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	20.00	15.00
122	EMP119	benjaminaquino@msumain.edu.ph	password123	Benjamin Aquino	College of Business Administration and Accountancy	Assoc Prof. V	Permanent	employee	145.71	145.71	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	291.42	60.00
123	EMP120	susanortega@msumain.edu.ph	password123	Susan Ortega	College of Business Administration and Accountancy	Assoc Prof. IV	Permanent	employee	10.00	10.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	22	20.00	0.00
114	EMP111	dennisherrera@msumain.edu.ph	password123	Dennis Herrera	College of Business Administration and Accountancy	Instructor I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
115	EMP112	maritesvillamor@msumain.edu.ph	password123	Marites Villamor	College of Business Administration and Accountancy	Asst. Prof. IV	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	2.50	0.00
116	EMP113	joelnavarro@msumain.edu.ph	password123	Joel Navarro	College of Business Administration and Accountancy	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
117	EMP114	femendoza@msumain.edu.ph	password123	Fe Mendoza	College of Business Administration and Accountancy	Inst I	Probationary	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	2.50	0.00
118	EMP115	edwinlopez@msumain.edu.ph	password123	Edwin Lopez	College of Business Administration and Accountancy	Professor IV	Permanent	employee	100.79	100.79	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	27	201.58	60.00
119	EMP116	ginamorales@msumain.edu.ph	password123	Gina Morales	College of Business Administration and Accountancy	Assoc Prof. V	Permanent	employee	23.86	23.86	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	47.73	60.00
120	EMP117	rogercastillo@msumain.edu.ph	password123	Roger Castillo	College of Business Administration and Accountancy	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	2.50	0.00
121	EMP118	lornareyes@msumain.edu.ph	password123	Lorna Reyes	College of Business Administration and Accountancy	Assoc Prof. V	Permanent	employee	1.25	1.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	23	2.50	0.00
187	EMP184	lolitamabini@msumain.edu.ph	password123	Lolita Mabini	College of Business Administration and Accountancy	Instructor III	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	0.00	0.00
188	EMP185	domingovelasco@msumain.edu.ph	password123	Domingo Velasco	College of Business Administration and Accountancy	Instructor II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	13	0.00	0.00
189	EMP186	adelarobredo@msumain.edu.ph	password123	Adela Robredo	College of Business Administration and Accountancy	Instructor II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	13	0.00	0.00
190	EMP187	hilariogonzaga@msumain.edu.ph	password123	Hilario Gonzaga	College of Business Administration and Accountancy	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
191	EMP188	lourdesmanansala@msumain.edu.ph	password123	Lourdes Manansala	College of Business Administration and Accountancy	Instructor I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	0.00	0.00
192	EMP189	pedrotalavera@msumain.edu.ph	password123	Pedro Talavera	College of Business Administration and Accountancy	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
174	EMP171	isidrolagman@msumain.edu.ph	password123	Isidro Lagman	College of Social Sciences and Humanities	Instructor I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	0.00	0.00
89	EMP086	rizzacamacho@msumain.edu.ph	password123	Rizza Camacho	Board of Regents	URA II	Temporary	employee	174.91	174.91	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	349.81	269.88
90	EMP087	antoniosison@msumain.edu.ph	password123	Antonio Sison	Board of Regents	ADA IV	Temporary	employee	61.25	61.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	122.50	15.00
91	EMP088	maribelcarpio@msumain.edu.ph	password123	Maribel Carpio	Board of Regents	Board Sec. V	Permanent	employee	312.00	312.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	25	624.00	82.00
92	EMP089	albertrosales@msumain.edu.ph	password123	Albert Rosales	Board of Regents	University Secretary I	Temporary	employee	20.88	20.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	28	41.75	13.00
175	EMP172	concepcionhilario@msumain.edu.ph	password123	Concepcion Hilario	College of Social Sciences and Humanities	Instructor I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	0.00	0.00
176	EMP173	napoleonarellano@msumain.edu.ph	password123	Napoleon Arellano	College of Social Sciences and Humanities	Instructor II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	13	0.00	0.00
177	EMP174	estrellatadeo@msumain.edu.ph	password123	Estrella Tadeo	College of Social Sciences and Humanities	Instructor II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	13	0.00	0.00
178	EMP175	bonifaciohermosa@msumain.edu.ph	password123	Bonifacio Hermosa	College of Social Sciences and Humanities	Instructor I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	0.00	0.00
179	EMP176	divinabatoon@msumain.edu.ph	password123	Divina Batoon	College of Social Sciences and Humanities	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
180	EMP177	leopoldoandaya@msumain.edu.ph	password123	Leopoldo Andaya	College of Social Sciences and Humanities	Instructor III	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	0.00	0.00
181	EMP178	carmelitamorente@msumain.edu.ph	password123	Carmelita Morente	College of Social Sciences and Humanities	Instructor III	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	0.00	0.00
182	EMP179	severinopalmes@msumain.edu.ph	password123	Severino Palmes	College of Social Sciences and Humanities	Instructor I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	12	0.00	0.00
183	EMP180	natividadlobo@msumain.edu.ph	password123	Natividad Lobo	College of Social Sciences and Humanities	Instructor III	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	0.00	0.00
185	EMP182	beatrizalmazan@msumain.edu.ph	password123	Beatriz Almazan	College of Social Sciences and Humanities	Instructor III	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	0.00	0.00
186	EMP183	cristobalyambao@msumain.edu.ph	password123	Cristobal Yambao	College of Social Sciences and Humanities	Assistant Professor I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	15	0.00	0.00
95	EMP092	jessamalabanan@msumain.edu.ph	password123	Jessa Malabanan	Accounting Division Office	ADOF I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	10	0.00	0.00
96	EMP093	rolandoesguerra@msumain.edu.ph	password123	Rolando Esguerra	Administrative Aide Staff	ADAS I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	7	0.00	0.00
97	EMP094	ivycalderon@msumain.edu.ph	password123	Ivy Calderon	Administrative Aide Staff	ADAS II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	8	0.00	0.00
41	EMP038	hannahcorpuz@msumain.edu.ph	password123	Hannah Corpuz	Cultural Affairs Office	Musician	 Temporary	employee	124.00	124.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	5	248.00	35.00
42	EMP039	leocordero@msumain.edu.ph	password123	Leo Cordero	Cultural Affairs Office	Adm.Aide VI	 Temporary	employee	120.69	120.69	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	241.38	45.00
43	EMP040	melissaibarra@msumain.edu.ph	password123	Melissa Ibarra	Cultural Affairs Office	CAO II	 Temporary	employee	259.50	259.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	519.00	182.00
44	EMP041	francistolentino@msumain.edu.ph	password123	Francis Tolentino	Cultural Affairs Office	ADOF IV	 Temporary	employee	71.25	71.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	142.50	30.00
45	EMP042	irenecaballero@msumain.edu.ph	password123	Irene Caballero	Cultural Affairs Office	Media Production Spe	 Temporary	employee	289.25	289.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	11	578.50	220.00
46	EMP043	arvinbalagtas@msumain.edu.ph	password123	Arvin Balagtas	Cultural Affairs Office	Comm. Aff.Off. III	Permanent	employee	68.56	68.56	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	18	137.13	30.00
47	EMP044	rheapadilla@msumain.edu.ph	password123	Rhea Padilla	Cultural Affairs Office	Musician	Permanent	employee	158.75	158.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	5	317.50	75.00
48	EMP045	allanvergara@msumain.edu.ph	password123	Allan Vergara	Audio Visual Center	ADA IV	Temporary	employee	86.88	86.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	173.75	30.00
49	EMP046	joycealonzo@msumain.edu.ph	password123	Joyce Alonzo	Audio Visual Center	ADAS II	Temporary	employee	177.25	177.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	8	354.50	268.00
50	EMP047	marvinevangelista@msumain.edu.ph	password123	Marvin Evangelista	Audio Visual Center	SADOF	Permanent	employee	72.88	72.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	22	145.75	20.00
51	EMP048	donnalucero@msumain.edu.ph	password123	Donna Lucero	Audio Visual Center	ADA VI	Temporary	employee	190.50	190.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	381.00	150.00
52	EMP049	ryanfajardo@msumain.edu.ph	password123	Ryan Fajardo	Audio Visual Center	ADA V	Temporary	employee	83.75	83.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	5	167.50	20.00
53	EMP050	maytorres@msumain.edu.ph	password123	May Torres	Audio Visual Center	ADA I	Temporary	employee	57.50	57.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	1	115.00	15.00
54	EMP051	dennispacheco@msumain.edu.ph	password123	Dennis Pacheco	Audio Visual Center	ADA III	Temporary	employee	118.75	118.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	3	237.50	50.00
55	EMP052	clarissago@msumain.edu.ph	password123	Clarissa Go	Audio Visual Center	ADA III	Temporary	employee	52.50	52.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	3	105.00	15.00
56	EMP053	joelmarquez@msumain.edu.ph	password123	Joel Marquez	Audio Visual Center	ADA VI	Temporary	employee	126.25	126.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	252.50	50.00
57	EMP054	aileenramos@msumain.edu.ph	password123	Aileen Ramos	Audio Visual Center	ADA VI	Temporary	employee	199.50	199.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	399.00	55.00
58	EMP055	gilbertsy@msumain.edu.ph	password123	Gilbert Sy	Audio Visual Center	ADA V	Permanent	employee	256.00	256.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	5	512.00	75.00
59	EMP056	maureenyulo@msumain.edu.ph	password123	Maureen Yulo	Sports Scholarship Dev. Office	Adm.Aide IV	Temporary	employee	143.50	143.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	287.00	80.00
60	EMP057	robertopalma@msumain.edu.ph	password123	Roberto Palma	Sports Scholarship Dev. Office	Trng.Spcl. II	Temporary	employee	246.25	246.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	492.50	0.00
61	EMP058	janineuy@msumain.edu.ph	password123	Janine Uy	Sports Scholarship Dev. Office	ADA I	Temporary	employee	30.00	30.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	1	60.00	0.00
62	EMP059	oscardevera@msumain.edu.ph	password123	Oscar De Vera	Sports Scholarship Dev. Office	Trng.Spcl. III	Temporary	employee	30.00	30.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	18	60.00	0.00
63	EMP060	kristinealviar@msumain.edu.ph	password123	Kristine Alviar	Sports Scholarship Dev. Office	ADA I	Temporary	employee	105.50	105.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	1	211.00	28.00
64	EMP061	allandomingo@msumain.edu.ph	password123	Allan Domingo	Sports Scholarship Dev. Office	ADOF I	Temporary	employee	195.00	195.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	10	390.00	0.00
65	EMP062	phoebetan@msumain.edu.ph	password123	Phoebe Tan	Board of Regents	ADOF IV	Temporary	employee	61.88	61.88	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	14	123.75	15.00
66	EMP063	noelcastaneda@msumain.edu.ph	password123	Noel Castañeda	Board of Regents	URA II	Permanent	employee	79.25	79.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	158.50	29.00
67	EMP064	rowenaicao@msumain.edu.ph	password123	Rowena Icao	Board of Regents	ADA VI	Temporary	employee	331.25	331.25	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	662.50	320.00
68	EMP065	wilsonlacsamana@msumain.edu.ph	password123	Wilson Lacsamana	Board of Regents	ADA IV	Temporary	employee	97.50	97.50	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	195.00	60.00
69	EMP066	dianamontoya@msumain.edu.ph	password123	Diana Montoya	Board of Regents	ADA IV	Temporary	employee	36.12	36.12	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	72.25	10.00
70	EMP067	arturobeltran@msumain.edu.ph	password123	Arturo Beltran	Board of Regents	Uni. Researcher II	Temporary	employee	152.44	152.44	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	304.88	284.38
71	EMP068	sallycordero@msumain.edu.ph	password123	Sally Cordero	Board of Regents	ADA IV	Temporary	employee	121.92	121.92	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	243.83	39.00
72	EMP069	renedelmundo@msumain.edu.ph	password123	Rene Del Mundo	Board of Regents	ADOF III	Temporary	employee	39.12	39.12	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	12	78.25	10.00
73	EMP070	aprilrobles@msumain.edu.ph	password123	April Robles	Board of Regents	ADA IV	Temporary	employee	36.75	36.75	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	4	73.50	5.00
74	EMP071	samuelalcantara@msumain.edu.ph	password123	Samuel Alcantara	Board of Regents	ADA VI	Temporary	employee	68.41	68.41	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	6	136.82	52.00
75	EMP072	myrafuentebella@msumain.edu.ph	password123	Myra Fuentebella	Board of Regents	Sr. ADAS III	Temporary	employee	125.83	125.83	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	15	251.67	36.00
76	EMP073	lesterpineda@msumain.edu.ph	password123	Lester Pineda	Board of Regents	ADOF II	Temporary	employee	195.00	195.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	12	390.00	116.00
98	EMP095	benjamintuazon@msumain.edu.ph	password123	Benjamin Tuazon	Administrative Aide Staff	ADAS II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	8	0.00	0.00
99	EMP096	lorieagustin@msumain.edu.ph	password123	Lorie Agustin	Campus Budget Office	Security Guard II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	5	0.00	0.00
100	EMP097	noelsoriano@msumain.edu.ph	password123	Noel Soriano	Accounting Division Office	ADOF I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	10	0.00	0.00
101	EMP098	hazelmacaraeg@msumain.edu.ph	password123	Hazel Macaraeg	Administrative Aide Staff	ADAS II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	8	0.00	0.00
102	EMP099	victorneri@msumain.edu.ph	password123	Victor Neri	Administrative Aide Staff	ADAS I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	7	0.00	0.00
103	EMP100	felicityramos@msumain.edu.ph	password123	Felicity Ramos	Administrative Aide Staff	ADAS I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	7	0.00	0.00
93	EMP090	teresabonifacio@msumain.edu.ph	password123	Teresa Bonifacio	Campus Budget Office	ADAS I	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	7	0.00	0.00
193	EMP190	consolacionbernal@msumain.edu.ph	password123	Consolacion Bernal	College of Business Administration and Accountancy	Instructor III	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	14	0.00	0.00
194	EMP191	crispinalvero@msumain.edu.ph	password123	Crispin Alvero	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	17	0.00	0.00
195	EMP192	josefinamedrano@msumain.edu.ph	password123	Josefina Medrano	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
196	EMP193	baltazarrollan@msumain.edu.ph	password123	Baltazar Roldan	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
197	EMP194	purificaciondelatorre@msumain.edu.ph	password123	Purificacion Dela Torre	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
198	EMP195	luciopoblador@msumain.edu.ph	password123	Lucio Poblador	College of Natural Sciences and Mathematics	Instructor II	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	13	0.00	0.00
199	EMP196	estefaniaquintos@msumain.edu.ph	password123	Estefania Quintos	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
200	EMP197	rogelioarrion@msumain.edu.ph	password123	Rogelio Barrion	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
201	EMP198	magdalenafortes@msumain.edu.ph	password123	Magdalena Fortes	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
202	EMP199	anselmocordova@msumain.edu.ph	password123	Anselmo Cordova	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
94	EMP091	edgarlapuz@msumain.edu.ph	password123	Edgar Lapuz	Administrative Aide Staff	ADAS III	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	non-teaching	9	0.00	0.00
203	EMP200	remediosvillar@msumain.edu.ph	password123	Remedios Villar	College of Natural Sciences and Mathematics	Assistant Professor IV	Contractual	employee	0.00	0.00	3.00	5.00	2026-02-06 14:12:29.399468	2026-05-15 14:04:36.15692	teaching	18	0.00	0.00
\.


--
-- Name: approval_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.approval_history_id_seq', 26, true);


--
-- Name: leave_applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_applications_id_seq', 10, true);


--
-- Name: leave_attachments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.leave_attachments_id_seq', 7, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 50, true);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 208, true);


--
-- Name: approval_history approval_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_pkey PRIMARY KEY (id);


--
-- Name: leave_applications leave_applications_application_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_application_number_key UNIQUE (application_number);


--
-- Name: leave_applications leave_applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_pkey PRIMARY KEY (id);


--
-- Name: leave_attachments leave_attachments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_attachments
    ADD CONSTRAINT leave_attachments_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_key UNIQUE (employee_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_leave_apps_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_apps_created_at ON public.leave_applications USING btree (created_at);


--
-- Name: idx_leave_apps_current_approver; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_apps_current_approver ON public.leave_applications USING btree (current_approver);


--
-- Name: idx_leave_apps_employee; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_apps_employee ON public.leave_applications USING btree (employee_id);


--
-- Name: idx_leave_apps_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_leave_apps_status ON public.leave_applications USING btree (status);


--
-- Name: idx_notifications_read; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_read ON public.notifications USING btree (is_read);


--
-- Name: idx_notifications_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_notifications_user ON public.notifications USING btree (user_id);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_employee_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_employee_id ON public.users USING btree (employee_id);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: leave_applications update_leave_apps_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_leave_apps_updated_at BEFORE UPDATE ON public.leave_applications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: users update_users_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: approval_history approval_history_approver_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_approver_id_fkey FOREIGN KEY (approver_id) REFERENCES public.users(id);


--
-- Name: approval_history approval_history_leave_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.approval_history
    ADD CONSTRAINT approval_history_leave_application_id_fkey FOREIGN KEY (leave_application_id) REFERENCES public.leave_applications(id) ON DELETE CASCADE;


--
-- Name: leave_applications leave_applications_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(employee_id);


--
-- Name: leave_applications leave_applications_hr_action_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_hr_action_by_fkey FOREIGN KEY (hr_action_by) REFERENCES public.users(id);


--
-- Name: leave_applications leave_applications_ovcaa_action_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_ovcaa_action_by_fkey FOREIGN KEY (ovcaa_action_by) REFERENCES public.users(id);


--
-- Name: leave_applications leave_applications_ovcaf_action_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_applications
    ADD CONSTRAINT leave_applications_ovcaf_action_by_fkey FOREIGN KEY (ovcaf_action_by) REFERENCES public.users(id);


--
-- Name: leave_attachments leave_attachments_leave_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_attachments
    ADD CONSTRAINT leave_attachments_leave_application_id_fkey FOREIGN KEY (leave_application_id) REFERENCES public.leave_applications(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_leave_application_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_leave_application_id_fkey FOREIGN KEY (leave_application_id) REFERENCES public.leave_applications(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict agyYFUSvMAiTgbT1dz0XO9wrgDS76DtJ4cIguVvLeX8iuW6teVq16waXF7K7W5C

