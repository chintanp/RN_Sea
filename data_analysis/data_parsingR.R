# Inital Setup
rm(list = ls())
options(digits=12)
setwd("E:\\Google Drive UW\\C2Smart-ReachNow\\code\\RN_Sea\\data_analysis")
#install.packages("readxl")
#install.packages("dplyr")
#install.packages("rworldmap")
#install.packages("ggmap")
#install.packages(c("mapproj", "maps"))
#install.packages("lubridate")


library(readxl)
library(dplyr)
library(maps)
library(mapproj)

# Read the trip data from the excel file
# Total ReachNow i3 data for USA
RN_US_data <- read_excel("i3_TRIP_DATA_REACHNOW_USA.xlsx")

#str(RN_US_data)

# Read the map boundaries for Seattle
maps_data <-
  read.csv("ReachNow_boundaries_Seattle_total.txt",
           header = TRUE,
           sep = "\t")

# Find the Seattle lat, long extremes
min_lat <- min(maps_data['latitude'])
min_long <- min(maps_data['longitude'])
max_lat = max(maps_data['latitude'])
max_long = max(maps_data['longitude'])
sea_center_lat = mean(min_lat, max_lat)
sea_center_long = mean(min_long, max_long)

# Extract Seattle trips from USA trips
# Remove NAs
RN_US_data_nonNull <-
  subset(RN_US_data, !RN_US_data$StartLocationLat == 'NA')
# Remove illegal trips and trips from other regions  !! Longitudes are working in reverse (?)
RN_Sea_data <-
  subset(
    RN_US_data_nonNull,
    StartLocationLat >= min_lat &
      EndLocationLat <= max_lat &
      StartLocationLng <= min_long & EndLocationLng >= max_long
  )

#Get Member trips
RN_Sea_data_member <- filter(RN_Sea_data, Type == 'M')

# Filter trips with non-zero miles travelled
RN_Sea_data_member_miles <-
  filter(RN_Sea_data_member, MileageDriven > 0)




# Minimum driving time 
#minDriveTime = min(RN_Sea_data_member_miles$DriveTime) --- did not work 
library(lubridate)

# remove entries with no start booking time
RN_Sea_data_member_miles_StartBooking = dplyr::filter(RN_Sea_data_member_miles, !is.na(RN_Sea_data_member_miles$BookingStartTime)) 
# Get the drive time in a usable unit - minutes
driveTimeFormatted = as.period(RN_Sea_data_member_miles_StartBooking$DriveTime, unit="minutes")
# Add a new column with all drive times in minutes
RN_Sea_data_member_miles_StartBooking$DriveTimeMinutes = driveTimeFormatted@day*24*60 + driveTimeFormatted@hour*60 + driveTimeFormatted@minute
# Filter out trips that are shorter than 5 minutes - as this is walkable distance time
RN_Sea_data_member_miles_StartBooking_Drive5 = subset(RN_Sea_data_member_miles_StartBooking, DriveTimeMinutes >= 5)

str(RN_Sea_data_member_miles_StartBooking_Drive5)

# make the columns of correct class
RN_Sea_data_member_miles_StartBooking_Drive5$MileageDriven = as.numeric(as.character(RN_Sea_data_member_miles_StartBooking_Drive5$MileageDriven))
RN_Sea_data_member_miles_StartBooking_Drive5$StartLocationLat = as.numeric(as.character(RN_Sea_data_member_miles_StartBooking_Drive5$StartLocationLat))
RN_Sea_data_member_miles_StartBooking_Drive5$EndLocationLat = as.numeric(RN_Sea_data_member_miles_StartBooking_Drive5$EndLocationLat)
RN_Sea_data_member_miles_StartBooking_Drive5$StartLocationLng = as.numeric(RN_Sea_data_member_miles_StartBooking_Drive5$StartLocationLng)
RN_Sea_data_member_miles_StartBooking_Drive5$EndLocationLng = as.numeric(RN_Sea_data_member_miles_StartBooking_Drive5$EndLocationLng)

#str(RN_Sea_data_member_miles_StartBooking_Drive5)

# Get start and end points
startPoints <-
  data.frame(long = RN_Sea_data_member_miles_StartBooking_Drive5$StartLocationLng,
             lat = RN_Sea_data_member_miles_StartBooking_Drive5$StartLocationLat)
endPoints <-
  data.frame(long = RN_Sea_data_member_miles_StartBooking_Drive5$EndLocationLng,
             lat = RN_Sea_data_member_miles_StartBooking_Drive5$EndLocationLat)

#str(endPoints)

# Assimilate the trips and save to a file
RN_Sea_trips <-
  data.frame(startPoints$lat,
             startPoints$long,
             endPoints$lat,
             endPoints$long)
write.table(
  RN_Sea_trips,
  "RN_Sea_trips.txt",
  sep = "\t",
  row.names = FALSE,
  quote = FALSE
)

# Temporal Analysis
# Find the variation in days
library(lubridate)
attach(RN_Sea_data_member_miles_StartBooking_Drive5)
# Parse the ReservationStartTime as datetime
ResStartDateTime = parse_date_time(ReservationStartTime,
                               c("Ymd HMS", "Ymd HM"),
                               tz = "America/Los_Angeles")
# Get date from datetime
ResStartDate = as.Date(format(as.POSIXct(ResStartDateTime, format="%Y-%m-%d %H:%M:%S"), "%Y-%m-%d"))
# plot to see the daily variation in booking
plot(table(ResStartDate), type="h", main="Daily Variation of Booking Frequency", xlab="Date", ylab="Frequency")
# Get the day of week
RN_Sea_data_member_miles_StartBooking_Drive5$DayofWeek = wday(ResStartDate, label = TRUE)
plot(table(RN_Sea_data_member_miles_StartBooking_Drive5$DayofWeek), type="l", main="Day of Week Variation of Booking Frequency", xlab="Day of Week", ylab="Frequency")
# Get time from datetime
ResStartTime = format(as.POSIXct(ResStartDateTime, format="%Y-%m-%d %H:%M:%S"), "%H:%M:%S")
ResStartHour = as.factor(format(as.POSIXct(ResStartDateTime, format="%Y-%m-%d %H:%M:%S"), "%H"))
#str(ResStartHour)
# Plot to see the hourly variation in booking frequency 
plot(table(ResStartHour))
plot(table(ResStartHour), type='l', main="Hourly Variation of Booking Frequency", xlab="Reservation Start Hour", ylab="Frequency")
# Create new columns from parsed data
RN_Sea_data_member_miles_StartBooking_Drive5$ResStartDate = ResStartDate
RN_Sea_data_member_miles_StartBooking_Drive5$ResStartTime = ResStartTime

# Parse the BookingStartTime as datetime
BookStartDateTime = parse_date_time(BookingStartTime,
                                   c("Ymd HMS", "Ymd HM"),
                                   tz = "America/Los_Angeles")

# Parse the BookingEndTime as datetime
BookEndDateTime = parse_date_time(BookingEndedAt,
                                    c("Ymd HMS", "Ymd HM"),
                                    tz = "America/Los_Angeles")

# Create new columns from parsed data
RN_Sea_data_member_miles_StartBooking_Drive5$BookStartDateTime = BookStartDateTime
RN_Sea_data_member_miles_StartBooking_Drive5$BookEndDateTime = BookEndDateTime



## K-means Clustering on trip endpoints
library(fossil)
d = earth.dist(head(endPoints, 4))
N = nrow(RN_Sea_data_member_miles_StartBooking_Drive5)
C = 100
plot(head(endPoints$long, N), head(endPoints$lat, N))
km = kmeans(cbind(head(endPoints$lat, N), head(endPoints$long, N)), centers = C)

plot(head(endPoints$long, N), head(endPoints$lat, N), col = km$cluster, pch=20)
