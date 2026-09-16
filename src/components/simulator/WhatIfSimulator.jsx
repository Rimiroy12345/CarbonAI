
import React, { useState, useEffect } from 'react';
import Slider from './Slider';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { runWhatIfSimulation } from '../../services/api';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';