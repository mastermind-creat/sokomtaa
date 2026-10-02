"""
Unit tests for nlp_service — meal extraction and headcount parsing.
"""

import pytest
from app.services.nlp_service import _extract_headcount, _extract_meals, ParseError, parse


class TestExtractHeadcount:
    def test_for_n(self):
        assert _extract_headcount("I want to cook for 5 people") == 5

    def test_n_people(self):
        assert _extract_headcount("Cooking for 10 visitors") == 10

    def test_bare_number(self):
        assert _extract_headcount("4") == 4

    def test_watu(self):
        assert _extract_headcount("watu 8 watakula") == 8

    def test_serves(self):
        assert _extract_headcount("serves 12") == 12

    def test_no_number(self):
        assert _extract_headcount("no number here") is None


class TestExtractMeals:
    def test_ugali(self):
        assert "ugali" in _extract_meals("I want ugali for dinner")

    def test_sukuma_wiki(self):
        assert "sukuma wiki" in _extract_meals("sukuma wiki and rice")

    def test_multiple_meals(self):
        meals = _extract_meals("ugali, sukuma wiki and beans")
        assert "ugali" in meals
        assert "sukuma wiki" in meals
        assert "beans" in meals

    def test_swahili_aliases(self):
        assert "eggs" in _extract_meals("I need mayai for breakfast")
        assert "rice" in _extract_meals("cook some wali")
        assert "beans" in _extract_meals("maharagwe please")

    def test_no_meal(self):
        assert _extract_meals("I want something delicious") == []

    def test_case_insensitive(self):
        assert "ugali" in _extract_meals("UGALI for 4 people")

    def test_chai(self):
        assert "chai" in _extract_meals("chai and mandazi")

    def test_nyama_choma(self):
        assert "nyama choma" in _extract_meals("nyama choma for the weekend")


class TestParse:
    def test_successful_parse(self):
        meals, headcount = parse("I want ugali for 4 people")
        assert "ugali" in meals
        assert headcount == 4

    def test_parse_error_no_meal(self):
        with pytest.raises(ParseError) as exc_info:
            parse("cook something for 5 people")
        assert "meal name" in exc_info.value.missing

    def test_parse_error_no_headcount(self):
        with pytest.raises(ParseError) as exc_info:
            parse("I want ugali and sukuma wiki")
        assert "headcount" in exc_info.value.missing

    def test_parse_error_nothing(self):
        with pytest.raises(ParseError):
            parse("hello world")
