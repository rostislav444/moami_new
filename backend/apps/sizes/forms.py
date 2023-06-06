from django import forms

from apps.sizes.models import SizeInterpretation


class SizeInterpretationForm(forms.ModelForm):
    class Meta:
        model = SizeInterpretation
        exclude = []

    def __init__(self, *args, **kwargs):
        super(SizeInterpretationForm, self).__init__(*args, **kwargs)

        self.fields['grid'].empty_label = None
